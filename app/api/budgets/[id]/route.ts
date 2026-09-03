import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Budget } from '@/models/Budget';
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
      const budget = await Budget.findOne({ _id: id, userId: authUser.userId });
      if (!budget) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }

      await Budget.deleteOne({ _id: id, userId: authUser.userId });

      return NextResponse.json({
        message: 'Budget deleted successfully. Associated transactions remain intact.',
      });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
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
      const budget = await Budget.findOne({ _id: id, userId: authUser.userId });
      if (!budget) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
      }

      if (body.name) budget.name = body.name;
      if (body.amount) budget.amount = body.amount;
      if (body.category !== undefined) budget.category = body.category;
      if (body.period) budget.period = body.period;

      await budget.save();

      return NextResponse.json({ message: 'Budget updated successfully', budget });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Update budget error:', error);
    return NextResponse.json({ error: 'Failed to update budget' }, { status: 500 });
  }
}
