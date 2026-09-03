import { NotificationPriority } from '@/models/Notification';

export interface AlertParameters {
  type: string;
  category: string;
  priority: NotificationPriority;
  entityName: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  daysRemaining?: number;
  percentage?: number;
  direction?: 'given' | 'borrowed';
  notes?: string;
}

export async function personalizeAlertWording(params: AlertParameters): Promise<{ title: string; message: string }> {
  const { type, entityName, amount, currency = '₹', dueDate, daysRemaining, percentage, direction } = params;

  // Fallback / Deterministic Template Generator
  const formattedAmount = `${currency}${amount.toLocaleString('en-IN')}`;

  if (type === 'loan_due') {
    if (direction === 'given') {
      if (daysRemaining === 0) {
        return {
          title: 'Loan Repayment Due Today',
          message: `${entityName}'s repayment of ${formattedAmount} is due today.`,
        };
      } else if (daysRemaining && daysRemaining < 0) {
        const daysOverdue = Math.abs(daysRemaining);
        return {
          title: '⚠️ Loan Repayment Overdue',
          message: `${entityName}'s repayment of ${formattedAmount} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue (Due ${dueDate}).`,
        };
      } else {
        return {
          title: 'Upcoming Loan Repayment',
          message: `${entityName}'s remaining repayment of ${formattedAmount} is due in ${daysRemaining} days (${dueDate}).`,
        };
      }
    } else {
      // Money Borrowed
      if (daysRemaining === 0) {
        return {
          title: 'Loan Payment Due Today',
          message: `Reminder: You need to pay ${entityName} ${formattedAmount} today.`,
        };
      } else if (daysRemaining && daysRemaining < 0) {
        return {
          title: '🔴 Loan Payment Overdue',
          message: `Overdue: You need to pay ${entityName} ${formattedAmount} (Due ${dueDate}).`,
        };
      } else {
        return {
          title: 'Upcoming Loan Payment',
          message: `Reminder: You need to pay ${entityName} ${formattedAmount} in ${daysRemaining} days (${dueDate}).`,
        };
      }
    }
  }

  if (type === 'bill_due') {
    if (daysRemaining === 0) {
      return {
        title: 'Bill Due Today',
        message: `💡 ${entityName} bill of ${formattedAmount} is due today.`,
      };
    } else if (daysRemaining && daysRemaining < 0) {
      return {
        title: '⚠️ Bill Payment Overdue',
        message: `🔴 ${entityName} bill of ${formattedAmount} was due on ${dueDate}.`,
      };
    } else {
      return {
        title: 'Upcoming Bill Payment',
        message: `💡 ${entityName} bill of ${formattedAmount} is due in ${daysRemaining} days (${dueDate}).`,
      };
    }
  }

  if (type === 'subscription_renewal') {
    return {
      title: '🔔 Subscription Renewal',
      message: `Your ${entityName} subscription of ${formattedAmount} renews in ${daysRemaining} days (${dueDate}).`,
    };
  }

  if (type === 'budget_warning') {
    if ((percentage || 0) >= 100) {
      return {
        title: '🔴 Budget Exceeded',
        message: `You've exceeded your ${entityName} budget (${percentage}% used).`,
      };
    }
    return {
      title: '⚠️ Budget Alert',
      message: `You've used ${percentage}% of your ${formattedAmount} ${entityName} budget.`,
    };
  }

  if (type === 'income_expected') {
    return {
      title: '💰 Expected Income',
      message: `Your ${formattedAmount} ${entityName} is expected on ${dueDate}.`,
    };
  }

  if (type === 'cash_flow') {
    return {
      title: '⚠️ Upcoming Cash-Flow Commitments',
      message: `You have ${formattedAmount} in upcoming financial commitments due this month against available funds.`,
    };
  }

  if (type === 'spending_alert') {
    return {
      title: '💡 Unusual Spending Alert',
      message: `Your ${entityName} spending this week (${formattedAmount}) is higher than your recent average.`,
    };
  }

  return {
    title: `${entityName} Reminder`,
    message: `${entityName} alert for ${formattedAmount}.`,
  };
}
