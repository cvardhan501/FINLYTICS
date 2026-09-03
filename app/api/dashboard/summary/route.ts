import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { BillSubscription } from '@/models/BillSubscription';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
import { Notification } from '@/models/Notification';
import { Account } from '@/models/Account';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { calculateBudgetStatus } from '@/lib/finance/calculations';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    // Execute parallel MongoDB queries with lean projections
    const [transactions, budgets, bills, loans, notifications, accounts] = await Promise.all([
      Transaction.find({ userId })
        .select('amount type category account date description paymentMethod')
        .sort({ date: -1 })
        .lean(),
      Budget.find({ userId }).lean(),
      BillSubscription.find({ userId }).sort({ dueDate: 1 }).lean(),
      Loan.find({ userId }).sort({ dueDate: 1 }).lean(),
      Notification.find({ userId, isRead: false }).sort({ createdAt: -1 }).limit(5).lean(),
      Account.find({ userId }).lean(),
    ]);

    // Income vs Expense Aggregation
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((acc, t: any) => acc + (t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc, t: any) => acc + (t.amount || 0), 0);

    const totalBalance = totalIncome - totalExpense;

    // Overall Budget Aggregation
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

    const monthExpenses = transactions
      .filter((t: any) => t.type === 'expense' && new Date(t.date) >= startOfMonth && new Date(t.date) <= endOfMonth)
      .reduce((acc, t: any) => acc + (t.amount || 0), 0);

    const overallBudgetDoc = budgets.find((b: any) => b.name?.toLowerCase().includes('overall'));
    const overallBudget = overallBudgetDoc
      ? {
          spent: monthExpenses,
          budgetAmount: overallBudgetDoc.amount || 0,
          percentage: overallBudgetDoc.amount > 0 ? Math.min(100, Math.round((monthExpenses / overallBudgetDoc.amount) * 100)) : 0,
        }
      : budgets.length > 0
      ? {
          spent: monthExpenses,
          budgetAmount: budgets.reduce((acc, b: any) => acc + (b.amount || 0), 0),
          percentage: Math.min(
            100,
            Math.round(
              (monthExpenses / (budgets.reduce((acc, b: any) => acc + (b.amount || 0), 0) || 1)) * 100
            )
          ),
        }
      : null;

    // Net Worth Calculations
    let assetsSum = accounts.filter((a: any) => a.balance > 0).reduce((acc, a: any) => acc + a.balance, 0);
    let liabilitiesSum = accounts.filter((a: any) => a.balance < 0).reduce((acc, a: any) => acc + Math.abs(a.balance), 0);

    // Calculate Loan remaining balances
    await Promise.all(
      loans.map(async (l: any) => {
        const payments = await LoanPayment.find({ loanId: l._id }).lean();
        const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
        const remaining = Math.max(0, l.principal - totalPaid);

        if (l.type === 'given') {
          assetsSum += remaining;
        } else {
          liabilitiesSum += remaining;
        }
      })
    );

    const netWorth = assetsSum - liabilitiesSum;

    // Upcoming Obligations
    const upcomingObligations = [
      ...bills.map((b: any) => ({
        id: b._id.toString(),
        title: b.name,
        amount: b.amount,
        date: b.dueDate,
        subtitle: b.isSubscription ? 'Subscription Renewal' : 'Bill Due',
        link: '/more/bills',
      })),
      ...loans
        .filter((l: any) => l.status !== 'paid')
        .map((l: any) => ({
          id: l._id.toString(),
          title: `${l.personName} (${l.type === 'given' ? 'To Receive' : 'To Pay'})`,
          amount: l.remainingAmount || l.principal,
          date: l.dueDate,
          subtitle: l.type === 'given' ? 'Receivable' : 'Payable',
          link: '/loans',
        })),
    ].slice(0, 3);

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      summary: {
        totalBalance,
        totalIncome,
        totalExpense,
        netWorth,
        assets: assetsSum,
        liabilities: liabilitiesSum,
        overallBudget,
        recentTransactions: transactions.slice(0, 5).map((t: any) => ({ ...t, id: t._id.toString() })),
        notifications: notifications.map((n: any) => ({ ...n, id: n._id.toString() })),
        upcomingObligations,
        responseTimeMs,
      },
    });
  } catch (error: any) {
    console.error('Dashboard summary API error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard summary' }, { status: 500 });
  }
}
