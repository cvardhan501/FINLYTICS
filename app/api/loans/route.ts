import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { loanSchema } from '@/schemas';
import { calculateInterest } from '@/lib/finance/calculations';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.userId;
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const db = await connectToDatabase();

    if (db) {
      const query: any = { userId };
      if (type && type !== 'all') query.type = type;
      if (status && status !== 'all') query.status = status;

      const loansList = await Loan.find(query).sort({ dueDate: 1 }).lean();
      const now = new Date();

      const populatedLoans = await Promise.all(
        loansList.map(async (l: any) => {
          const payments = await LoanPayment.find({ loanId: l._id }).sort({ paymentDate: -1 }).lean();
          const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

          const durationYears = (l.durationMonths || 12) / 12;
          const calc = calculateInterest({
            principal: l.principal,
            rate: l.interestRate || 0,
            durationYears,
            interestType: l.interestType || 'simple',
            compoundingFrequency: l.compoundingFrequency || 'annual',
          });

          const totalAmountDue = calc.totalAmount;
          const remainingAmount = Math.max(0, totalAmountDue - totalPaid);

          // Compute status
          let currentStatus = l.status;
          if (remainingAmount <= 0.01) {
            currentStatus = 'paid'; // Fully Settled
          } else if (new Date(l.dueDate) < now) {
            currentStatus = 'overdue';
          } else if (totalPaid > 0) {
            currentStatus = 'partially_paid';
          } else {
            currentStatus = 'active';
          }

          return {
            ...l,
            id: l._id.toString(),
            status: currentStatus,
            totalInterest: calc.interestAmount,
            totalAmountDue,
            totalPaid,
            remainingAmount,
            payments: payments.map((p: any) => ({
              ...p,
              id: p._id.toString(),
            })),
          };
        })
      );

      // Given Summary Math
      const givenLoans = populatedLoans.filter((l) => l.type === 'given');
      const totalGivenPrincipal = givenLoans.reduce((acc, l) => acc + l.principal, 0);
      const totalGivenPaid = givenLoans.reduce((acc, l) => acc + l.totalPaid, 0);
      const totalGivenRemaining = givenLoans.reduce((acc, l) => acc + l.remainingAmount, 0);
      const interestToReceive = givenLoans.reduce((acc, l) => acc + l.totalInterest, 0);

      // Borrowed Summary Math
      const borrowedLoans = populatedLoans.filter((l) => l.type === 'borrowed');
      const totalBorrowedPrincipal = borrowedLoans.reduce((acc, l) => acc + l.principal, 0);
      const totalBorrowedPaid = borrowedLoans.reduce((acc, l) => acc + l.totalPaid, 0);
      const totalBorrowedRemaining = borrowedLoans.reduce((acc, l) => acc + l.remainingAmount, 0);
      const interestToPay = borrowedLoans.reduce((acc, l) => acc + l.totalInterest, 0);

      return NextResponse.json({
        loans: populatedLoans,
        summary: {
          totalGiven: totalGivenPrincipal,
          totalGivenPaid,
          totalGivenRemaining,
          interestToReceive,
          totalBorrowed: totalBorrowedPrincipal,
          totalBorrowedPaid,
          totalBorrowedRemaining,
          interestToPay,
          netPosition: totalGivenRemaining - totalBorrowedRemaining,
          activeLoansCount: populatedLoans.filter((l) => l.status !== 'paid').length,
          settledLoansCount: populatedLoans.filter((l) => l.status === 'paid').length,
        },
      });
    }

    return NextResponse.json({
      loans: [],
      summary: {
        totalGiven: 0,
        totalGivenPaid: 0,
        totalGivenRemaining: 0,
        interestToReceive: 0,
        totalBorrowed: 0,
        totalBorrowedPaid: 0,
        totalBorrowedRemaining: 0,
        interestToPay: 0,
        netPosition: 0,
        activeLoansCount: 0,
        settledLoansCount: 0,
      },
    });
  } catch (error: any) {
    console.error('Fetch loans error:', error);
    return NextResponse.json({ error: 'Failed to fetch loans' }, { status: 500 });
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
    const result = loanSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const loanData = result.data;
    const db = await connectToDatabase();

    if (db) {
      const newLoan = await Loan.create({
        userId,
        ...loanData,
        startDate: new Date(loanData.startDate),
        dueDate: new Date(loanData.dueDate),
      });

      return NextResponse.json({ message: 'Loan created successfully', loan: newLoan });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Create loan error:', error);
    return NextResponse.json({ error: 'Failed to create loan' }, { status: 500 });
  }
}
