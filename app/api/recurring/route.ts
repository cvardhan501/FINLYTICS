import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { RecurringTransaction } from '@/models/RecurringTransaction';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();

    if (db) {
      const items = await RecurringTransaction.find({ userId: authUser.userId }).lean();
      return NextResponse.json({ recurring: items.map((i: any) => ({ ...i, id: i._id.toString() })) });
    }

    return NextResponse.json({ recurring: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}
