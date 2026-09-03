import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { loanPaymentSchema } from '@/schemas';
import { calculateInterest } from '@/lib/finance/calculations';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = loanPaymentSchema.safeParse({ ...body, loanId: id });

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid repayment details', details: result.error.format() },
        { status: 400 }
      );
    }

    const { amount, paymentDate, paymentMethod, notes } = result.data;
    const db = await connectToDatabase();

    if (db) {
      const loan = await Loan.findOne({ _id: id, userId: authUser.userId });
      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
      }

      // Calculate current total paid and total amount due
      const existingPayments = await LoanPayment.find({ loanId: loan._id }).lean();
      const currentPaid = existingPayments.reduce((acc, p) => acc + p.amount, 0);

      const durationYears = (loan.durationMonths || 12) / 12;
      const calc = calculateInterest({
        principal: loan.principal,
        rate: loan.interestRate || 0,
        durationYears,
        interestType: loan.interestType || 'simple',
        compoundingFrequency: loan.compoundingFrequency || 'annual',
      });

      const totalAmountDue = calc.totalAmount;
      const remainingAmount = Math.max(0, totalAmountDue - currentPaid);

      // Prevent overpayment
      if (amount > remainingAmount + 0.01) {
        return NextResponse.json(
          {
            error: `Payment amount cannot exceed the remaining balance of ₹${remainingAmount.toLocaleString('en-IN')}`,
          },
          { status: 400 }
        );
      }

      const newPayment = await LoanPayment.create({
        userId: authUser.userId,
        loanId: id,
        amount,
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod || 'UPI',
        notes: notes || '',
      });

      const newTotalPaid = currentPaid + amount;
      const newRemaining = Math.max(0, totalAmountDue - newTotalPaid);

      // Update Loan Status
      if (newRemaining <= 0.01) {
        loan.status = 'paid';
      } else if (newTotalPaid > 0) {
        loan.status = 'partially_paid';
      }
      await loan.save();

      return NextResponse.json({
        message: 'Payment recorded successfully',
        payment: newPayment,
        paidAmount: newTotalPaid,
        remainingAmount: newRemaining,
        status: loan.status,
      });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Repayment error:', error);
    return NextResponse.json({ error: 'Failed to record repayment' }, { status: 500 });
  }
}
