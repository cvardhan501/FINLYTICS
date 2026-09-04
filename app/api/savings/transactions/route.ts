import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsTransaction } from '@/models/SavingsTransaction';
import { SavingsGoal } from '@/models/SavingsGoal';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { savingsTransactionSchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get('type');
    const goalFilter = searchParams.get('goalId');
    const searchQuery = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const query: any = { userId: authUser.userId };

    if (typeFilter && typeFilter !== 'all') {
      query.type = typeFilter;
    }

    if (goalFilter && goalFilter !== 'all') {
      query.goalId = goalFilter;
    }

    let sortOption: any = { date: -1 };
    if (sortBy === 'oldest') sortOption = { date: 1 };
    else if (sortBy === 'highest') sortOption = { amount: -1 };
    else if (sortBy === 'lowest') sortOption = { amount: 1 };

    let rawTransactions = await SavingsTransaction.find(query).sort(sortOption).lean();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rawTransactions = rawTransactions.filter(
        (tx: any) =>
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          (tx.paymentMethod && tx.paymentMethod.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q)
      );
    }

    // Populate Goal details if attached
    const goalsMap = new Map();
    const goals = await SavingsGoal.find({ userId: authUser.userId }).lean();
    goals.forEach((g: any) => goalsMap.set(g._id.toString(), g.name));

    const transactions = rawTransactions.map((tx: any) => ({
      ...tx,
      id: tx._id.toString(),
      goalName: tx.goalId ? goalsMap.get(tx.goalId.toString()) || null : null,
    }));

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Fetch savings transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = savingsTransactionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { type, amount, date, goalId, paymentMethod, note, attachment } = validation.data;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    // Compute existing total savings to validate withdrawal limit
    const existingTxs = await SavingsTransaction.find({ userId: authUser.userId }).lean();
    let currentTotalSavings = 0;
    existingTxs.forEach((tx: any) => {
      if (tx.type === 'deposit') currentTotalSavings += tx.amount || 0;
      if (tx.type === 'withdrawal') currentTotalSavings -= tx.amount || 0;
    });

    if (type === 'withdrawal' && amount > currentTotalSavings + 0.01) {
      return NextResponse.json(
        {
          error: `Insufficient savings balance. Available savings: ₹${currentTotalSavings.toLocaleString('en-IN')}`,
        },
        { status: 400 }
      );
    }

    const newTx: any = await SavingsTransaction.create({
      userId: authUser.userId,
      type,
      amount,
      date: new Date(date),
      goalId: goalId || undefined,
      paymentMethod: paymentMethod || 'UPI',
      note: note || '',
      attachment: attachment || '',
    });

    // If assigned to a savings goal, update goal's currentAmount
    if (goalId) {
      const goal = await SavingsGoal.findOne({ _id: goalId, userId: authUser.userId });
      if (goal) {
        if (type === 'deposit') {
          goal.currentAmount = (goal.currentAmount || 0) + amount;
        } else if (type === 'withdrawal') {
          goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - amount);
        }

        if (goal.currentAmount >= goal.targetAmount) {
          goal.status = 'completed';
          goal.isCompleted = true;
        } else {
          goal.status = 'active';
          goal.isCompleted = false;
        }
        await goal.save();
      }
    }

    return NextResponse.json({
      message: 'Savings transaction recorded successfully',
      transaction: { ...newTx.toObject(), id: newTx._id.toString() },
    });
  } catch (error: any) {
    console.error('Create savings transaction error:', error);
    return NextResponse.json({ error: 'Failed to record transaction' }, { status: 500 });
  }
}
