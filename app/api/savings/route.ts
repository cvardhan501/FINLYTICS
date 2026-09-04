import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsTransaction } from '@/models/SavingsTransaction';
import { SavingsGoal } from '@/models/SavingsGoal';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
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

    // Parallel fetch of transactions and goals
    const [transactions, goals] = await Promise.all([
      SavingsTransaction.find({ userId }).sort({ date: -1 }).lean(),
      SavingsGoal.find({ userId }).sort({ targetDate: 1 }).lean(),
    ]);

    // Financial calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    let totalDeposits = 0;
    let totalWithdrawn = 0;
    let savedThisMonth = 0;

    transactions.forEach((tx: any) => {
      const amt = tx.amount || 0;
      const txDate = new Date(tx.date);

      if (tx.type === 'deposit') {
        totalDeposits += amt;
        if (txDate >= startOfMonth && txDate <= endOfMonth) {
          savedThisMonth += amt;
        }
      } else if (tx.type === 'withdrawal') {
        totalWithdrawn += amt;
      }
    });

    const totalSavings = Math.max(0, totalDeposits - totalWithdrawn);

    // Savings Goals Progress calculation
    let goalsProgress = 0;
    const totalGoalsCount = goals.length;
    if (totalGoalsCount > 0) {
      const totalSavedInGoals = goals.reduce((acc: number, g: any) => acc + (g.currentAmount || 0), 0);
      const totalTargetInGoals = goals.reduce((acc: number, g: any) => acc + (g.targetAmount || 1), 0);
      goalsProgress = Math.min(100, Math.round((totalSavedInGoals / totalTargetInGoals) * 100));
    }

    // Build monthly trend data for chart (last 6 months)
    const monthlyTrend: Array<{ month: string; deposits: number; withdrawals: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      let mDep = 0;
      let mWth = 0;

      transactions.forEach((tx: any) => {
        const txDate = new Date(tx.date);
        if (txDate >= mStart && txDate <= mEnd) {
          if (tx.type === 'deposit') mDep += tx.amount || 0;
          if (tx.type === 'withdrawal') mWth += tx.amount || 0;
        }
      });

      monthlyTrend.push({
        month: monthLabel,
        deposits: mDep,
        withdrawals: mWth,
      });
    }

    return NextResponse.json({
      summary: {
        totalSavings,
        savedThisMonth,
        totalWithdrawn,
        goalsProgress,
        goalsCount: totalGoalsCount,
      },
      monthlyTrend,
      recentTransactions: transactions.slice(0, 5).map((tx: any) => ({
        ...tx,
        id: tx._id.toString(),
      })),
    });
  } catch (error: any) {
    console.error('Fetch savings summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch savings summary' }, { status: 500 });
  }
}
