import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Account } from '@/models/Account';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();

    if (db) {
      const accounts = await Account.find({ userId: authUser.userId }).lean();
      return NextResponse.json({ accounts: accounts.map((a: any) => ({ ...a, id: a._id.toString() })) });
    }

    return NextResponse.json({ accounts: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await connectToDatabase();

    if (db) {
      const newAcc = await Account.create({
        userId: authUser.userId,
        name: body.name,
        type: body.type || 'bank',
        balance: body.balance || 0,
        currency: body.currency || 'INR',
        isDefault: body.isDefault || false,
      });
      return NextResponse.json({ message: 'Account added successfully', account: newAcc });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to add account' }, { status: 500 });
  }
}
