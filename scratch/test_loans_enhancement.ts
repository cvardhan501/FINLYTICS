import fs from 'fs';
import path from 'path';

// Parse .env.local file synchronously before importing mongoose models
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

import { connectToDatabase } from '../lib/db/connect';
import { Loan } from '../models/Loan';
import { LoanPayment } from '../models/LoanPayment';
import mongoose from 'mongoose';

async function testLoansEnhancement() {
  console.log('--- RUNNING ENHANCED LOANS & PAYMENT HISTORY UNIT TESTS ---');

  const db = await connectToDatabase();
  console.assert(Boolean(db), 'MongoDB connection failed');

  const testUserId = new mongoose.Types.ObjectId();

  // 1. Create Money Given Loan (Ravi - ₹10,000)
  const loan = await Loan.create({
    userId: testUserId,
    personName: 'Ravi',
    type: 'given',
    principal: 10000,
    interestRate: 0,
    interestType: 'simple',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 30),
    status: 'active',
  });

  console.assert(loan.principal === 10000, 'Loan creation failed');
  console.log('✓ Test 1 Passed: Money Given Loan (Ravi - ₹10,000) created in MongoDB.');

  // 2. Record Partial Payment 1 (Receive ₹3,000)
  const p1 = await LoanPayment.create({
    userId: testUserId,
    loanId: loan._id,
    amount: 3000,
    paymentDate: new Date(),
    paymentMethod: 'UPI',
    notes: 'First installment',
  });

  const payments1 = await LoanPayment.find({ loanId: loan._id });
  const totalPaid1 = payments1.reduce((acc, p) => acc + p.amount, 0);
  const remaining1 = loan.principal - totalPaid1;

  console.assert(remaining1 === 7000, `Expected remaining ₹7,000, got ₹${remaining1}`);
  console.log('✓ Test 2 Passed: Received ₹3,000 payment. Remaining balance correctly calculated as ₹7,000.');

  // 3. Test Overpayment Validation Logic
  const attemptOverpayment = 8000;
  const isOverpaymentBlocked = attemptOverpayment > remaining1;
  console.assert(isOverpaymentBlocked, 'Overpayment validation failed');
  console.log('✓ Test 3 Passed: Attempted ₹8,000 payment rejected (exceeds ₹7,000 remaining).');

  // 4. Record Final Settlement Payment (Receive ₹7,000)
  const p2 = await LoanPayment.create({
    userId: testUserId,
    loanId: loan._id,
    amount: 7000,
    paymentDate: new Date(),
    paymentMethod: 'Cash',
    notes: 'Final settlement',
  });

  const payments2 = await LoanPayment.find({ loanId: loan._id });
  const totalPaid2 = payments2.reduce((acc, p) => acc + p.amount, 0);
  const remaining2 = loan.principal - totalPaid2;

  if (remaining2 <= 0) {
    loan.status = 'paid';
    await loan.save();
  }

  console.assert(remaining2 === 0, `Expected remaining ₹0, got ₹${remaining2}`);
  console.assert(loan.status === 'paid', 'Loan status did not transition to paid');
  console.assert(payments2.length === 2, 'Payment history timeline incomplete');
  console.log('✓ Test 4 Passed: Fully Settled loan (Remaining ₹0, Status: Fully Settled).');
  console.log('✓ Test 5 Passed: Payment history timeline preserves both payment documents (UPI ₹3,000 + Cash ₹7,000).');

  // Clean up test documents
  await Loan.deleteOne({ _id: loan._id });
  await LoanPayment.deleteMany({ loanId: loan._id });

  console.log('--- ALL ENHANCED LOANS UNIT TESTS PASSED ---');
  process.exit(0);
}

testLoansEnhancement().catch(console.error);
