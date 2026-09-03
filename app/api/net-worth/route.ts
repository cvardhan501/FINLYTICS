import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Account } from '@/models/Account';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
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
      const userAccounts = await Account.find({ userId }).lean();
      const userLoans = await Loan.find({ userId }).lean();

      const assets: { name: string; amount: number }[] = [];
      const liabilities: { name: string; amount: number }[] = [];

      // Accounts
      userAccounts.forEach((acc: any) => {
        if (acc.balance >= 0) {
          assets.push({ name: acc.name, amount: acc.balance });
        } else {
          liabilities.push({ name: acc.name, amount: Math.abs(acc.balance) });
        }
      });

      // Loans given (Receivable Asset) and Loans borrowed (Payable Liability)
      let givenRemaining = 0;
      let borrowedRemaining = 0;

      await Promise.all(
        userLoans.map(async (l: any) => {
          const payments = await LoanPayment.find({ loanId: l._id }).lean();
          const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
          const remaining = Math.max(0, l.principal - totalPaid);

          if (l.type === 'given') {
            givenRemaining += remaining;
          } else {
            borrowedRemaining += remaining;
          }
        })
      );

      if (givenRemaining > 0) {
        assets.push({ name: 'Money Given (Receivable)', amount: givenRemaining });
      }

      if (borrowedRemaining > 0) {
        liabilities.push({ name: 'Money Borrowed (Payable)', amount: borrowedRemaining });
      }

      const totalAssets = assets.reduce((acc, item) => acc + item.amount, 0);
      const totalLiabilities = liabilities.reduce((acc, item) => acc + item.amount, 0);
      const netWorth = totalAssets - totalLiabilities;

      return NextResponse.json({
        netWorth,
        totalAssets,
        totalLiabilities,
        assets,
        liabilities,
      });
    }

    return NextResponse.json({
      netWorth: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      assets: [],
      liabilities: [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch net worth statement' }, { status: 500 });
  }
}
