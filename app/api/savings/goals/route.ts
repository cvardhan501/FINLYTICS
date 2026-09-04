import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsGoal } from '@/models/SavingsGoal';
import { SavingsTransaction } from '@/models/SavingsTransaction';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { savingsGoalSchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const goals = await SavingsGoal.find({ userId: authUser.userId })
      .sort({ targetDate: 1 })
      .lean();

    const formattedGoals = goals.map((g: any) => {
      const currentAmount = g.currentAmount || 0;
      const targetAmount = g.targetAmount || 1;
      const percentage = Math.min(100, Math.round((currentAmount / targetAmount) * 100));

      return {
        ...g,
        id: g._id.toString(),
        currentAmount,
        targetAmount,
        percentage,
      };
    });

    return NextResponse.json({ goals: formattedGoals });
  } catch (error: any) {
    console.error('Fetch savings goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch savings goals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = savingsGoalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, targetAmount, currentAmount, targetDate, category, notes, description, icon } =
      validation.data;

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const initialSaved = currentAmount || 0;
    const isCompleted = initialSaved >= targetAmount;

    const goal = await SavingsGoal.create({
      userId: authUser.userId,
      name,
      targetAmount,
      currentAmount: initialSaved,
      targetDate: new Date(targetDate),
      category: category || 'General',
      notes: notes || '',
      description: description || '',
      icon: icon || 'Target',
      status: isCompleted ? 'completed' : 'active',
      isCompleted,
    });

    // If initial amount provided, create initial deposit SavingsTransaction linked to this goal
    if (initialSaved > 0) {
      await SavingsTransaction.create({
        userId: authUser.userId,
        type: 'deposit',
        amount: initialSaved,
        date: new Date(),
        goalId: goal._id,
        paymentMethod: 'Initial Deposit',
        note: `Initial allocation for ${name}`,
      });
    }

    return NextResponse.json({
      message: 'Savings goal created successfully',
      goal: { ...goal.toObject(), id: goal._id.toString() },
    });
  } catch (error: any) {
    console.error('Create savings goal error:', error);
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 });
  }
}
