import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Asset } from '@/models/Asset';
import { Liability } from '@/models/Liability';
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

    if (!db) {
      return NextResponse.json({
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        assets: [],
        liabilities: [],
        history: [],
      });
    }

    // Parallel query all user-scoped financial data
    const [userAssets, userLiabilities, userAccounts, userLoans, userPayments] = await Promise.all([
      Asset.find({ userId }).sort({ createdAt: -1 }).lean(),
      Liability.find({ userId }).sort({ createdAt: -1 }).lean(),
      Account.find({ userId }).lean(),
      Loan.find({ userId }).lean(),
      LoanPayment.find({ userId }).lean(),
    ]);

    const assets: Array<{
      id?: string;
      name: string;
      type: string;
      amount: number;
      date?: Date | string;
      notes?: string;
      attachment?: string;
      isManual?: boolean;
      loanId?: string;
    }> = [];

    const liabilities: Array<{
      id?: string;
      name: string;
      type: string;
      amount: number;
      date?: Date | string;
      notes?: string;
      attachment?: string;
      isManual?: boolean;
      loanId?: string;
    }> = [];

    // 1. Process manually added Assets
    userAssets.forEach((a: any) => {
      assets.push({
        id: a._id.toString(),
        name: a.name,
        type: a.type || 'other',
        amount: Number(a.amount || 0),
        date: a.date,
        notes: a.notes,
        attachment: a.attachment,
        isManual: true,
        loanId: a.loanId ? a.loanId.toString() : undefined,
      });
    });

    // 2. Process manually added Liabilities
    userLiabilities.forEach((l: any) => {
      liabilities.push({
        id: l._id.toString(),
        name: l.name,
        type: l.type || 'other',
        amount: Number(l.amount || 0),
        date: l.date,
        notes: l.notes,
        attachment: l.attachment,
        isManual: true,
        loanId: l.loanId ? l.loanId.toString() : undefined,
      });
    });

    // 3. Process Accounts balances (if any exist)
    userAccounts.forEach((acc: any) => {
      const balance = Number(acc.balance || 0);
      if (balance > 0) {
        assets.push({
          id: 'acc_' + acc._id.toString(),
          name: acc.name,
          type: acc.type || 'bank',
          amount: balance,
          isManual: false,
        });
      } else if (balance < 0) {
        liabilities.push({
          id: 'acc_' + acc._id.toString(),
          name: acc.name,
          type: acc.type || 'credit_card',
          amount: Math.abs(balance),
          isManual: false,
        });
      }
    });

    // 4. Process Loans & Interest (Money Given = Asset, Money Borrowed = Liability)
    const paymentsByLoan = new Map<string, number>();
    userPayments.forEach((p: any) => {
      const lId = p.loanId.toString();
      paymentsByLoan.set(lId, (paymentsByLoan.get(lId) || 0) + Number(p.amount || 0));
    });

    let givenOutstandingTotal = 0;
    let borrowedOutstandingTotal = 0;

    userLoans.forEach((loan: any) => {
      // Exclude paid or cancelled loans from active receivables/payables
      if (loan.status === 'paid' || loan.status === 'cancelled') {
        return;
      }
      const totalPaid = paymentsByLoan.get(loan._id.toString()) || 0;
      const remaining = Math.max(0, Number(loan.principal || 0) - totalPaid);

      if (remaining > 0) {
        if (loan.type === 'given') {
          givenOutstandingTotal += remaining;
        } else {
          borrowedOutstandingTotal += remaining;
        }
      }
    });

    if (givenOutstandingTotal > 0) {
      assets.push({
        id: 'loan_receivable',
        name: 'Money Given (Receivable)',
        type: 'money_given',
        amount: givenOutstandingTotal,
        isManual: false,
      });
    }

    if (borrowedOutstandingTotal > 0) {
      liabilities.push({
        id: 'loan_payable',
        name: 'Money Borrowed (Payable)',
        type: 'money_borrowed',
        amount: borrowedOutstandingTotal,
        isManual: false,
      });
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const netWorth = totalAssets - totalLiabilities;

    // Calculate History timeline from dated records if records exist
    const history: Array<{ date: string; netWorth: number; assets: number; liabilities: number }> = [];

    // Combine dated assets and liabilities for timeline if present
    const allDatedItems = [
      ...userAssets.map((a: any) => ({ date: new Date(a.date || a.createdAt), amount: Number(a.amount), type: 'asset' })),
      ...userLiabilities.map((l: any) => ({ date: new Date(l.date || l.createdAt), amount: Number(l.amount), type: 'liability' })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    if (allDatedItems.length > 0) {
      let runningAssets = 0;
      let runningLiabilities = 0;
      allDatedItems.forEach((item) => {
        if (item.type === 'asset') runningAssets += item.amount;
        if (item.type === 'liability') runningLiabilities += item.amount;
        const dateStr = item.date.toISOString().split('T')[0];
        history.push({
          date: dateStr,
          netWorth: runningAssets - runningLiabilities,
          assets: runningAssets,
          liabilities: runningLiabilities,
        });
      });
    }

    return NextResponse.json({
      netWorth,
      totalAssets,
      totalLiabilities,
      assets,
      liabilities,
      history,
    });
  } catch (error: any) {
    console.error('Net Worth API error:', error);
    return NextResponse.json({ error: 'Failed to fetch net worth statement' }, { status: 500 });
  }
}
