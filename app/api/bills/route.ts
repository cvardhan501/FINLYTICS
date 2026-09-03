import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { BillSubscription } from '@/models/BillSubscription';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const db = await connectToDatabase();

    if (db) {
      const list = await BillSubscription.find({ userId }).sort({ dueDate: 1 }).lean();
      return NextResponse.json({ bills: list.map((b: any) => ({ ...b, id: b._id.toString() })) });
    }

    return NextResponse.json({ bills: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const body = await req.json();

    const db = await connectToDatabase();
    if (db) {
      const bill = await BillSubscription.create({
        userId,
        ...body,
        dueDate: new Date(body.dueDate),
      });

      return NextResponse.json({ message: 'Bill created successfully', bill });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
