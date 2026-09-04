import { Asset } from '@/models/Asset';
import { Liability } from '@/models/Liability';
import { Account } from '@/models/Account';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';

export interface FinancialSummaryResult {
  availableMoney: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assets: Array<{
    id?: string;
    name: string;
    type: string;
    amount: number;
    date?: Date | string;
    notes?: string;
    attachment?: string;
    isManual?: boolean;
    loanId?: string;
  }>;
  liabilities: Array<{
    id?: string;
    name: string;
    type: string;
    amount: number;
    date?: Date | string;
    notes?: string;
    attachment?: string;
    isManual?: boolean;
    loanId?: string;
  }>;
  history: Array<{
    date: string;
    netWorth: number;
    assets: number;
    liabilities: number;
  }>;
}

/**
 * Calculates single source of truth for Available Money, Total Assets, Total Liabilities, and Net Worth.
 * Strictly scoped by authenticated userId.
 */
export async function calculateUserFinancialSummary(userId: string): Promise<FinancialSummaryResult> {
  const [userAssets, userLiabilities, userAccounts, userLoans, userPayments] = await Promise.all([
    Asset.find({ userId }).sort({ createdAt: -1 }).lean(),
    Liability.find({ userId }).sort({ createdAt: -1 }).lean(),
    Account.find({ userId }).lean(),
    Loan.find({ userId }).lean(),
    LoanPayment.find({ userId }).lean(),
  ]);

  const assets: FinancialSummaryResult['assets'] = [];
  const liabilities: FinancialSummaryResult['liabilities'] = [];
  let availableMoney = 0;

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

  // 3. Process Account balances
  // Positive account balances = Assets & Available Money (if liquid)
  // Negative account balances = Liabilities (e.g. credit card)
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

      // Liquid spendable accounts contribute to Available Money
      const liquidTypes = ['cash', 'bank', 'upi', 'savings', 'debit_card', 'custom'];
      if (liquidTypes.includes(acc.type || 'bank')) {
        availableMoney += balance;
      }
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

  // 4. Process Loans & Loan Payments
  const paymentsByLoan = new Map<string, number>();
  userPayments.forEach((p: any) => {
    const lId = p.loanId.toString();
    paymentsByLoan.set(lId, (paymentsByLoan.get(lId) || 0) + Number(p.amount || 0));
  });

  let givenOutstandingTotal = 0;
  let borrowedOutstandingTotal = 0;

  userLoans.forEach((loan: any) => {
    // Exclude paid or cancelled loans
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

  // 5. Calculate Net Worth History timeline
  const history: FinancialSummaryResult['history'] = [];
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

  return {
    availableMoney,
    totalAssets,
    totalLiabilities,
    netWorth,
    assets,
    liabilities,
    history,
  };
}
