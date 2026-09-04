import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Liability } from '@/models/Liability';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { liabilitySchema } from '@/schemas';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = liabilitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
    }

    const updatedLiability = await Liability.findOneAndUpdate(
      { _id: id, userId: authUser.userId },
      {
        name: result.data.name,
        type: result.data.type,
        amount: result.data.amount,
        date: result.data.date ? new Date(result.data.date) : new Date(),
        notes: result.data.notes || '',
        attachment: result.data.attachment || '',
        loanId: result.data.loanId || null,
      },
      { new: true }
    );

    if (!updatedLiability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Liability updated successfully',
      liability: { ...updatedLiability.toObject(), id: updatedLiability._id.toString() },
    });
  } catch (error: any) {
    console.error('Update Liability API error:', error);
    return NextResponse.json({ error: 'Failed to update liability' }, { status: 500 });
  }
}

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

    const deletedLiability = await Liability.findOneAndDelete({ _id: id, userId: authUser.userId });

    if (!deletedLiability) {
      return NextResponse.json({ error: 'Liability not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Liability deleted successfully' });
  } catch (error: any) {
    console.error('Delete Liability API error:', error);
    return NextResponse.json({ error: 'Failed to delete liability' }, { status: 500 });
  }
}
