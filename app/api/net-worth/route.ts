import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { calculateUserFinancialSummary } from '@/lib/finance/netWorthCalculator';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({
        availableMoney: 0,
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        assets: [],
        liabilities: [],
        history: [],
      });
    }

    const summary = await calculateUserFinancialSummary(userId);

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Net Worth API error:', error);
    return NextResponse.json({ error: 'Failed to fetch net worth statement' }, { status: 500 });
  }
}
