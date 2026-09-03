import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsGoal } from '@/models/SavingsGoal';
import { SavingsContribution } from '@/models/SavingsContribution';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, date, paymentMethod, note } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Please enter a valid contribution amount' }, { status: 400 });
    }

    const db = await connectToDatabase();

    if (db) {
      const goal = await SavingsGoal.findOne({ _id: id, userId: authUser.userId });
      if (!goal) {
        return NextResponse.json({ error: 'Savings goal not found' }, { status: 404 });
      }

      // Calculate current total saved from existing contribution documents
      const existingContribs = await SavingsContribution.find({ goalId: goal._id }).lean();
      const currentSaved = Math.max(goal.currentAmount || 0, existingContribs.reduce((acc, c) => acc + c.amount, 0));
      const remainingAmount = Math.max(0, goal.targetAmount - currentSaved);

      // Overpayment Protection Validation
      if (amount > remainingAmount + 0.01) {
        return NextResponse.json(
          {
            error: `Amount exceeds the remaining goal amount of ₹${remainingAmount.toLocaleString('en-IN')}`,
          },
          { status: 400 }
        );
      }

      const newContribution = await SavingsContribution.create({
        userId: authUser.userId,
        goalId: id,
        amount,
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'UPI',
        note: note || '',
      });

      const newTotalSaved = currentSaved + amount;
      const newRemaining = Math.max(0, goal.targetAmount - newTotalSaved);

      // Update goal state
      goal.currentAmount = newTotalSaved;
      if (newRemaining <= 0.01) {
        goal.status = 'completed';
        goal.isCompleted = true;
      }
      await goal.save();

      return NextResponse.json({
        message: 'Savings contribution recorded successfully',
        contribution: newContribution,
        currentAmount: newTotalSaved,
        remainingAmount: newRemaining,
        status: goal.status,
      });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Record savings contribution error:', error);
    return NextResponse.json({ error: 'Failed to record contribution' }, { status: 500 });
  }
}
