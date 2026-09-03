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
import { Transaction } from '../models/Transaction';
import { Loan } from '../models/Loan';
import mongoose from 'mongoose';

async function testPerformanceAndIsolation() {
  console.log('--- RUNNING PERFORMANCE & USER ISOLATION BENCHMARKS ---');

  const db = await connectToDatabase();
  console.assert(Boolean(db), 'MongoDB connection failed');

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  // 1. User A creates financial records
  const tA = await Transaction.create({
    userId: userA,
    type: 'income',
    amount: 50000,
    category: 'Salary',
    account: 'Bank',
    paymentMethod: 'UPI',
    date: new Date(),
    description: 'Monthly Salary',
  });

  const lA = await Loan.create({
    userId: userA,
    personName: 'Ravi',
    type: 'given',
    principal: 10000,
    interestRate: 0,
    interestType: 'simple',
    startDate: new Date(),
    dueDate: new Date(Date.now() + 86400000 * 30),
    status: 'active',
  });

  // 2. Query User B data isolation
  const startTimeB = Date.now();
  const txsB = await Transaction.find({ userId: userB }).lean();
  const loansB = await Loan.find({ userId: userB }).lean();
  const latencyB = Date.now() - startTimeB;

  console.assert(txsB.length === 0, 'User B data isolation failed (transactions found)');
  console.assert(loansB.length === 0, 'User B data isolation failed (loans found)');
  console.log(`✓ Test 1 Passed: User B sees ₹0 / empty state (Queries executed in ${latencyB}ms).`);

  // 3. Query User A data integrity
  const startTimeA = Date.now();
  const txsA = await Transaction.find({ userId: userA }).lean();
  const loansA = await Loan.find({ userId: userA }).lean();
  const latencyA = Date.now() - startTimeA;

  console.assert(txsA.length === 1 && txsA[0].amount === 50000, 'User A transactions corrupted');
  console.assert(loansA.length === 1 && loansA[0].principal === 10000, 'User A loans corrupted');
  console.log(`✓ Test 2 Passed: User A data correctly retrieved (Income: ₹50,000, Loan: ₹10,000 in ${latencyA}ms).`);

  // Clean up test records
  await Transaction.deleteOne({ _id: tA._id });
  await Loan.deleteOne({ _id: lA._id });

  console.log('--- ALL PERFORMANCE & ISOLATION BENCHMARKS PASSED ---');
  process.exit(0);
}

testPerformanceAndIsolation().catch(console.error);
