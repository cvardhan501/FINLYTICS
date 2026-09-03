import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Transaction } from '@/models/Transaction';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    const db = await connectToDatabase();

    if (db && authUser) {
      const deleted = await Transaction.findOneAndDelete({ _id: id, userId: authUser.userId });
      if (!deleted) {
        return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
      }
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
      const updated = await Transaction.findOneAndUpdate({ _id: id, userId: authUser.userId }, body, { new: true });
      if (!updated) {
        return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
      }
      return NextResponse.json({ message: 'Transaction updated successfully', transaction: updated });
    }

    return NextResponse.json({ message: 'Transaction updated successfully', transaction: body });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
