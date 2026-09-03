import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Budget } from '@/models/Budget';
import { Transaction } from '@/models/Transaction';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { calculateBudgetStatus } from '@/lib/finance/calculations';
import { budgetSchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const db = await connectToDatabase();

    if (db) {
      const budgetDocs = await Budget.find({ userId }).lean();

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

      const populatedBudgets = await Promise.all(
        budgetDocs.map(async (b: any) => {
          const query: any = {
            userId,
            type: 'expense',
            date: { $gte: startOfMonth, $lte: endOfMonth },
          };
          if (b.category) query.category = b.category;

          const expenses = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: null, totalSpent: { $sum: '$amount' } } },
          ]);

          const totalSpent = expenses[0]?.totalSpent || 0;
          const status = calculateBudgetStatus(totalSpent, b.amount, b.warningThreshold || 80);

          return {
            ...b,
            id: b._id.toString(),
            spent: totalSpent,
            budgetAmount: b.amount,
            remaining: status.remaining,
            percentage: status.percentage,
            isWarning: status.isWarning,
            isExceeded: status.isOverBudget,
          };
        })
      );

      return NextResponse.json({ budgets: populatedBudgets });
    }

    return NextResponse.json({ budgets: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const body = await req.json();
    const result = budgetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      const budget = await Budget.create({
        userId,
        ...result.data,
      });

      return NextResponse.json({ message: 'Budget created successfully', budget });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
  }
}
