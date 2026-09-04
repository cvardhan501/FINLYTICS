import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Liability } from '@/models/Liability';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { liabilitySchema } from '@/schemas';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const liability = await Liability.create({
      userId: authUser.userId,
      name: result.data.name,
      type: result.data.type,
      amount: result.data.amount,
      date: result.data.date ? new Date(result.data.date) : new Date(),
      notes: result.data.notes || '',
      attachment: result.data.attachment || '',
      loanId: result.data.loanId || null,
    });

    return NextResponse.json({
      message: 'Liability added successfully',
      liability: { ...liability.toObject(), id: liability._id.toString() },
    });
  } catch (error: any) {
    console.error('Add Liability API error:', error);
    return NextResponse.json({ error: 'Failed to add liability' }, { status: 500 });
  }
}
