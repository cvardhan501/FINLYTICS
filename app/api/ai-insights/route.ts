import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Transaction } from '@/models/Transaction';
import { Budget } from '@/models/Budget';
import { Loan } from '@/models/Loan';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const db = await connectToDatabase();

    if (db) {
      const transactions = await Transaction.find({ userId }).lean();
      const budgets = await Budget.find({ userId }).lean();
      const loans = await Loan.find({ userId }).lean();

      const insights = [];

      if (transactions.length === 0 && budgets.length === 0 && loans.length === 0) {
        return NextResponse.json({ insights: [] });
      }

      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = transactions
        .filter((t) => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

      if (totalIncome > 0 && totalExpense > 0) {
        const savingsRate = Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
        insights.push({
          id: 'ins_sav',
          title: 'Savings Rate Analysis',
          message: `Your current savings rate is ${savingsRate}%. Total Income: ₹${totalIncome.toLocaleString(
            'en-IN'
          )}, Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}.`,
          type: savingsRate >= 20 ? 'positive' : 'warning',
        });
      }

      const activeLoansCount = loans.filter((l) => l.status !== 'paid').length;
      if (activeLoansCount > 0) {
        insights.push({
          id: 'ins_loan',
          title: 'Active Loans Summary',
          message: `You have ${activeLoansCount} active loan record(s) currently open.`,
          type: 'info',
        });
      }

      return NextResponse.json({ insights });
    }

    return NextResponse.json({ insights: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to generate AI insights' }, { status: 500 });
  }
}
