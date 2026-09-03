import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Transaction } from '@/models/Transaction';
import { Account } from '@/models/Account';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { transactionSchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const account = searchParams.get('account');

    const db = await connectToDatabase();

    if (db) {
      const query: any = { userId };
      if (type && type !== 'all') query.type = type;
      if (category && category !== 'all') query.category = category;
      if (account && account !== 'all') query.account = account;
      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { notes: { $regex: search, $options: 'i' } },
        ];
      }

      const transactions = await Transaction.find(query).sort({ date: -1 }).lean();
      return NextResponse.json({ transactions });
    }

    return NextResponse.json({ transactions: [] });
  } catch (error: any) {
    console.error('Fetch transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
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
    const result = transactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const txData = result.data;
    const db = await connectToDatabase();

    if (db) {
      const newTx = await Transaction.create({
        userId,
        ...txData,
        date: new Date(txData.date),
      });

      if (txData.account) {
        const balanceChange = txData.type === 'income' ? txData.amount : -txData.amount;
        await Account.findOneAndUpdate({ userId, name: txData.account }, { $inc: { balance: balanceChange } });
      }

      return NextResponse.json({ message: 'Transaction added successfully', transaction: newTx });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
  }
}
