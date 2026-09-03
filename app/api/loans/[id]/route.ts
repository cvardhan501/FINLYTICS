import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Loan } from '@/models/Loan';
import { LoanPayment } from '@/models/LoanPayment';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const loan = await Loan.findOne({ _id: id, userId: authUser.userId });
      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
      }

      // Delete loan and associated payments
      await Loan.deleteOne({ _id: id, userId: authUser.userId });
      await LoanPayment.deleteMany({ loanId: id, userId: authUser.userId });

      return NextResponse.json({ message: 'Loan and payment history deleted successfully' });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Delete loan error:', error);
    return NextResponse.json({ error: 'Failed to delete loan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const db = await connectToDatabase();

    if (db) {
      const loan = await Loan.findOne({ _id: id, userId: authUser.userId });
      if (!loan) {
        return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
      }

      if (body.personName) loan.personName = body.personName;
      if (body.principal) loan.principal = body.principal;
      if (body.interestRate !== undefined) loan.interestRate = body.interestRate;
      if (body.interestType) loan.interestType = body.interestType;
      if (body.dueDate) loan.dueDate = new Date(body.dueDate);
      if (body.notes !== undefined) loan.notes = body.notes;

      await loan.save();

      return NextResponse.json({ message: 'Loan updated successfully', loan });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    console.error('Update loan error:', error);
    return NextResponse.json({ error: 'Failed to update loan' }, { status: 500 });
  }
}
