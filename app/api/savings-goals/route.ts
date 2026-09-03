import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsGoal } from '@/models/SavingsGoal';
import { SavingsContribution } from '@/models/SavingsContribution';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { savingsGoalSchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const db = await connectToDatabase();

    if (db) {
      const now = new Date();
      const rawGoals = await SavingsGoal.find({ userId: authUser.userId }).sort({ targetDate: 1 }).lean();

      const populatedGoals = await Promise.all(
        rawGoals.map(async (g: any) => {
          const contributions = await SavingsContribution.find({ goalId: g._id })
            .sort({ date: -1 })
            .lean();

          const totalContributions = contributions.reduce((acc, c) => acc + c.amount, 0);
          const currentSaved = Math.max(g.currentAmount || 0, totalContributions);
          const targetAmount = g.targetAmount || 1;

          const remainingAmount = Math.max(0, targetAmount - currentSaved);
          const percentage = Math.min(100, Math.round((currentSaved / targetAmount) * 100));

          let calculatedStatus = g.status || 'active';
          if (currentSaved >= targetAmount || percentage >= 100) {
            calculatedStatus = 'completed';
          } else if (new Date(g.targetDate) < now) {
            calculatedStatus = 'overdue';
          } else {
            calculatedStatus = 'active';
          }

          return {
            ...g,
            id: g._id.toString(),
            currentAmount: currentSaved,
            remainingAmount,
            percentage,
            status: calculatedStatus,
            isCompleted: calculatedStatus === 'completed',
            contributions: contributions.map((c: any) => ({
              ...c,
              id: c._id.toString(),
            })),
          };
        })
      );

      const filteredGoals = populatedGoals.filter((g) => {
        if (!statusFilter || statusFilter === 'all') return true;
        return g.status === statusFilter;
      });

      const totalSavedSum = populatedGoals.reduce((acc, g) => acc + g.currentAmount, 0);
      const totalTargetSum = populatedGoals.reduce((acc, g) => acc + g.targetAmount, 0);

      return NextResponse.json({
        goals: filteredGoals,
        summary: {
          totalSaved: totalSavedSum,
          totalTarget: totalTargetSum,
          activeGoalsCount: populatedGoals.filter((g) => g.status === 'active').length,
          completedGoalsCount: populatedGoals.filter((g) => g.status === 'completed').length,
        },
      });
    }

    return NextResponse.json({
      goals: [],
      summary: { totalSaved: 0, totalTarget: 0, activeGoalsCount: 0, completedGoalsCount: 0 },
    });
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
    const result = savingsGoalSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    const db = await connectToDatabase();

    if (db) {
      const initialSaved = data.currentAmount || 0;
      const targetAmt = data.targetAmount;
      const initialStatus = initialSaved >= targetAmt ? 'completed' : 'active';

      const newGoal = await SavingsGoal.create({
        userId: authUser.userId,
        name: data.name,
        targetAmount: targetAmt,
        currentAmount: initialSaved,
        targetDate: new Date(data.targetDate),
        category: data.category || 'General',
        priority: body.priority || 'medium',
        notes: data.notes || '',
        status: initialStatus,
        isCompleted: initialStatus === 'completed',
      });

      // If initial currentAmount > 0, record initial contribution in SavingsContribution
      if (initialSaved > 0) {
        await SavingsContribution.create({
          userId: authUser.userId,
          goalId: newGoal._id,
          amount: initialSaved,
          date: new Date(),
          paymentMethod: 'Initial Deposit',
          note: 'Starting savings balance',
        });
      }

      return NextResponse.json({ message: 'Savings goal created successfully', goal: newGoal });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Create goal error:', error);
    return NextResponse.json({ error: 'Failed to create savings goal' }, { status: 500 });
  }
}
