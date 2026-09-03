import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsGoal } from '@/models/SavingsGoal';
import { SavingsContribution } from '@/models/SavingsContribution';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const goal = await SavingsGoal.findOne({ _id: id, userId: authUser.userId });
      if (!goal) {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
      }

      await SavingsGoal.deleteOne({ _id: id, userId: authUser.userId });
      await SavingsContribution.deleteMany({ goalId: id, userId: authUser.userId });

      return NextResponse.json({ message: 'Savings goal and contribution history deleted successfully' });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Delete goal error:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await connectToDatabase();

    if (db) {
      const goal = await SavingsGoal.findOne({ _id: id, userId: authUser.userId });
      if (!goal) {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
      }

      if (body.name) goal.name = body.name;
      if (body.targetAmount) goal.targetAmount = body.targetAmount;
      if (body.targetDate) goal.targetDate = new Date(body.targetDate);
      if (body.category) goal.category = body.category;
      if (body.priority) goal.priority = body.priority;
      if (body.notes !== undefined) goal.notes = body.notes;

      await goal.save();

      return NextResponse.json({ message: 'Savings goal updated successfully', goal });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Update goal error:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}
