import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
import { BillSubscription } from '@/models/BillSubscription';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { Notification, NotificationCategory, NotificationPriority, NotificationType } from '@/models/Notification';
import { calculateInterest, calculateBudgetStatus } from '@/lib/finance/calculations';
import { personalizeAlertWording } from './aiPersonalizer';

export interface ProcessedReminderResult {
  userId: string;
  createdNotifications: number;
  skippedDuplicates: number;
}

export async function processUserReminders(userId: string): Promise<ProcessedReminderResult> {
  const db = await connectToDatabase();
  let createdCount = 0;
  let skippedCount = 0;

  if (!db) {
    return { userId, createdNotifications: 0, skippedDuplicates: 0 };
  }

  const user = await User.findById(userId);
  if (!user) {
    return { userId, createdNotifications: 0, skippedDuplicates: 0 };
  }

  const settings = user.notificationSettings || {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to create notification safely with deduplication
  const createNotification = async (params: {
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    priority: NotificationPriority;
    linkUrl: string;
    relatedEntityType?: 'BillSubscription' | 'Budget' | 'Loan' | 'RecurringTransaction' | 'Transaction';
    relatedEntityId?: any;
    deduplicationKey: string;
  }) => {
    try {
      const existing = await Notification.findOne({ deduplicationKey: params.deduplicationKey });
      if (existing) {
        skippedCount++;
        return;
      }

      await Notification.create({
        userId: user._id,
        ...params,
        isRead: false,
        scheduledFor: new Date(),
      });
      createdCount++;
    } catch (err: any) {
      if (err.code === 11000) {
        // Mongo duplicate key error
        skippedCount++;
      } else {
        console.error('Error creating notification:', err);
      }
    }
  };

  // ==========================================
  // 1. LOAN REMINDERS & PARTIAL PAYMENTS
  // ==========================================
  if (settings.loanReminders !== false) {
    const loans = await Loan.find({ userId: user._id, status: { $ne: 'paid' } }).lean();

    for (const l of loans) {
      // Calculate remaining amount after partial payments
      const payments = await LoanPayment.aggregate([
        { $match: { loanId: l._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const totalPaid = payments[0]?.total || 0;

      const durationYears = (l.durationMonths || 12) / 12;
      const calc = calculateInterest({
        principal: l.principal,
        rate: l.interestRate || 0,
        durationYears,
        interestType: l.interestType || 'simple',
        compoundingFrequency: l.compoundingFrequency || 'annual',
      });

      const totalDue = calc.totalAmount;
      const remainingAmount = Math.max(0, Number((totalDue - totalPaid).toFixed(2)));

      // If fully settled, skip
      if (remainingAmount <= 0) continue;

      const due = new Date(l.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDueDate = due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      let stage: string | null = null;
      let priority: NotificationPriority = 'info';

      if (diffDays === 7) stage = '7-day';
      else if (diffDays === 3) stage = '3-day';
      else if (diffDays === 1) {
        stage = '1-day';
        priority = 'warning';
      } else if (diffDays === 0) {
        stage = 'due-today';
        priority = 'warning';
      } else if (diffDays === -1) {
        stage = 'overdue-1-day';
        priority = 'urgent';
      } else if (diffDays === -3) {
        stage = 'overdue-3-day';
        priority = 'urgent';
      } else if (diffDays === -7) {
        stage = 'overdue-7-day';
        priority = 'urgent';
      }

      if (stage) {
        const dedupKey = `loan:${l._id}:due:${due.toISOString().split('T')[0]}:${stage}`;
        const alertWording = await personalizeAlertWording({
          type: 'loan_due',
          category: 'loans',
          priority,
          entityName: l.personName,
          amount: remainingAmount,
          dueDate: formattedDueDate,
          daysRemaining: diffDays,
          direction: l.type,
        });

        await createNotification({
          title: alertWording.title,
          message: alertWording.message,
          type: 'loan_due',
          category: 'loans',
          priority,
          linkUrl: '/loans',
          relatedEntityType: 'Loan',
          relatedEntityId: l._id,
          deduplicationKey: dedupKey,
        });
      }
    }
  }

  // ==========================================
  // 2. BILLS & SUBSCRIPTION REMINDERS
  // ==========================================
  if (settings.billReminders !== false || settings.subscriptionReminders !== false) {
    const bills = await BillSubscription.find({ userId: user._id, status: 'unpaid' }).lean();

    for (const b of bills) {
      const due = new Date(b.dueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDueDate = due.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      let stage: string | null = null;
      let priority: NotificationPriority = 'info';

      if (diffDays === 7) stage = '7-day';
      else if (diffDays === 3) stage = '3-day';
      else if (diffDays === 1) {
        stage = '1-day';
        priority = 'warning';
      } else if (diffDays === 0) {
        stage = 'due-today';
        priority = 'warning';
      } else if (diffDays < 0) {
        stage = `overdue-${Math.abs(diffDays)}-day`;
        priority = 'urgent';
      }

      if (stage) {
        const isSub = b.isSubscription;
        if (isSub && settings.subscriptionReminders === false) continue;
        if (!isSub && settings.billReminders === false) continue;

        const dedupKey = `bill:${b._id}:due:${due.toISOString().split('T')[0]}:${stage}`;
        const alertWording = await personalizeAlertWording({
          type: isSub ? 'subscription_renewal' : 'bill_due',
          category: isSub ? 'subscriptions' : 'bills',
          priority,
          entityName: b.name,
          amount: b.amount,
          dueDate: formattedDueDate,
          daysRemaining: diffDays,
        });

        await createNotification({
          title: alertWording.title,
          message: alertWording.message,
          type: 'bill_due',
          category: isSub ? 'subscriptions' : 'bills',
          priority,
          linkUrl: '/more/bills',
          relatedEntityType: 'BillSubscription',
          relatedEntityId: b._id,
          deduplicationKey: dedupKey,
        });
      }
    }
  }

  // ==========================================
  // 3. RECURRING TRANSACTIONS & EXPECTED INCOME
  // ==========================================
  if (settings.recurringAlerts !== false || settings.incomeReminders !== false) {
    const recurring = await RecurringTransaction.find({ userId: user._id, isActive: true }).lean();

    for (const r of recurring) {
      const nextRun = new Date(r.nextRunDate);
      nextRun.setHours(0, 0, 0, 0);
      const diffDays = Math.round((nextRun.getTime() - today.getTime()) / (1000 * 3600 * 24));
      const formattedDate = nextRun.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

      if (diffDays === 1 || diffDays === 0) {
        const isIncome = r.type === 'income';
        if (isIncome && settings.incomeReminders === false) continue;
        if (!isIncome && settings.recurringAlerts === false) continue;

        const dedupKey = `recurring:${r._id}:date:${nextRun.toISOString().split('T')[0]}:${diffDays}d`;
        const alertWording = await personalizeAlertWording({
          type: isIncome ? 'income_expected' : 'recurring_scheduled',
          category: isIncome ? 'income' : 'smart_alerts',
          priority: 'info',
          entityName: r.name,
          amount: r.amount,
          dueDate: formattedDate,
          daysRemaining: diffDays,
        });

        await createNotification({
          title: alertWording.title,
          message: alertWording.message,
          type: isIncome ? 'income_expected' : 'recurring',
          category: isIncome ? 'income' : 'smart_alerts',
          priority: 'info',
          linkUrl: isIncome ? '/transactions' : '/more/recurring',
          relatedEntityType: 'RecurringTransaction',
          relatedEntityId: r._id,
          deduplicationKey: dedupKey,
        });
      }
    }
  }

  // ==========================================
  // 4. BUDGET THRESHOLD ALERTS (50%, 75%, 80%, 90%, 100%)
  // ==========================================
  if (settings.budgetAlerts !== false) {
    const budgets = await Budget.find({ userId: user._id }).lean();
    const currentMonth = today.toISOString().substring(0, 7);

    for (const b of budgets) {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

      const txQuery: any = {
        userId: user._id,
        type: 'expense',
        date: { $gte: startOfMonth, $lte: endOfMonth },
      };
      if (b.category) {
        txQuery.category = b.category;
      }

      const txs = await Transaction.aggregate([
        { $match: txQuery },
        { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
      ]);
      const spent = txs[0]?.totalSpent || 0;

      const status = calculateBudgetStatus(spent, b.amount, b.warningThreshold || 80);

      const thresholds = [50, 75, 80, 90, 100];
      for (const t of thresholds) {
        if (status.percentage >= t) {
          const dedupKey = `budget:${b._id}:month:${currentMonth}:threshold:${t}%`;
          const priority: NotificationPriority = t >= 100 ? 'urgent' : t >= 80 ? 'warning' : 'info';

          const alertWording = await personalizeAlertWording({
            type: 'budget_warning',
            category: 'budgets',
            priority,
            entityName: b.name,
            amount: b.amount,
            percentage: status.percentage,
          });

          await createNotification({
            title: alertWording.title,
            message: alertWording.message,
            type: 'budget_warning',
            category: 'budgets',
            priority,
            linkUrl: '/more/budgets',
            relatedEntityType: 'Budget',
            relatedEntityId: b._id,
            deduplicationKey: dedupKey,
          });
        }
      }
    }
  }

  // ==========================================
  // 5. UNUSUAL SPENDING ALERT
  // ==========================================
  if (settings.smartSpendingAlerts !== false) {
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);

    const recentSpending = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'expense', date: { $gte: sevenDaysAgo } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const monthlySpending = await Transaction.aggregate([
      { $match: { userId: user._id, type: 'expense', date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const monthlyMap: Record<string, number> = {};
    monthlySpending.forEach((item: any) => {
      monthlyMap[item._id] = item.total / 4;
    });

    for (const r of recentSpending) {
      const cat = r._id;
      const recentTotal = r.total;
      const avgWeekly = monthlyMap[cat] || 0;

      if (avgWeekly > 500 && recentTotal > avgWeekly * 1.5) {
        const weekKey = today.toISOString().substring(0, 10);
        const dedupKey = `spending_alert:${userId}:${cat}:${weekKey}`;

        const alertWording = await personalizeAlertWording({
          type: 'spending_alert',
          category: 'smart_alerts',
          priority: 'warning',
          entityName: cat,
          amount: recentTotal,
        });

        await createNotification({
          title: alertWording.title,
          message: alertWording.message,
          type: 'spending_alert',
          category: 'smart_alerts',
          priority: 'warning',
          linkUrl: '/analytics',
          deduplicationKey: dedupKey,
        });
      }
    }
  }

  return { userId, createdNotifications: createdCount, skippedDuplicates: skippedCount };
}
