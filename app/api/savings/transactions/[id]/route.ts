import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { SavingsTransaction } from '@/models/SavingsTransaction';
import { SavingsGoal } from '@/models/SavingsGoal';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    // Find transaction belonging to this user
    const tx = await SavingsTransaction.findOne({ _id: id, userId: authUser.userId });
    if (!tx) {
      return NextResponse.json({ error: 'Savings transaction not found or unauthorized' }, { status: 404 });
    }

    // If attached to a savings goal, revert goal's currentAmount
    if (tx.goalId) {
      const goal = await SavingsGoal.findOne({ _id: tx.goalId, userId: authUser.userId });
      if (goal) {
        if (tx.type === 'deposit') {
          goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - tx.amount);
        } else if (tx.type === 'withdrawal') {
          goal.currentAmount = (goal.currentAmount || 0) + tx.amount;
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

    await SavingsTransaction.deleteOne({ _id: id, userId: authUser.userId });

    return NextResponse.json({ message: 'Savings transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete savings transaction error:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
