import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Transaction } from '@/models/Transaction';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { syncAccountBalanceForTransaction } from '@/lib/finance/accountBalanceHelper';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    const db = await connectToDatabase();

    if (db && authUser) {
      const existing = await Transaction.findOne({ _id: id, userId: authUser.userId });
      if (!existing) {
        return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
      }

      await syncAccountBalanceForTransaction(
        authUser.userId,
        existing.account,
        existing.amount,
        existing.type,
        -1 // Revert balance
      );

      await Transaction.deleteOne({ _id: id, userId: authUser.userId });
    }

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    const body = await req.json();
    const db = await connectToDatabase();

    if (db && authUser) {
      const existing = await Transaction.findOne({ _id: id, userId: authUser.userId });
      if (!existing) {
        return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
      }

      // Revert old balance impact
      await syncAccountBalanceForTransaction(
        authUser.userId,
        existing.account,
        existing.amount,
        existing.type,
        -1
      );

      // Apply new balance impact
      const newType = body.type || existing.type;
      const newAmount = body.amount !== undefined ? Number(body.amount) : existing.amount;
      const newAccountName = body.account || existing.account;

      const accountDoc = await syncAccountBalanceForTransaction(
        authUser.userId,
        newAccountName,
        newAmount,
        newType,
        1
      );

      const updated = await Transaction.findOneAndUpdate(
        { _id: id, userId: authUser.userId },
        { ...body, accountId: accountDoc?._id },
        { new: true }
      );

      return NextResponse.json({ message: 'Transaction updated successfully', transaction: updated });
    }

    return NextResponse.json({ message: 'Transaction updated successfully', transaction: body });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
