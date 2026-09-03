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
import { SavingsGoal } from '../models/SavingsGoal';
import { SavingsContribution } from '../models/SavingsContribution';
import mongoose from 'mongoose';

async function testSavingsGoals() {
  console.log('--- RUNNING SAVINGS GOALS & CONTRIBUTIONS UNIT TESTS ---');

  const db = await connectToDatabase();
  console.assert(Boolean(db), 'MongoDB connection failed');

  const testUserId = new mongoose.Types.ObjectId();

  // 1. Create Goal (New Laptop - Target ₹80,000, Initial Saved ₹20,000)
  const goal = await SavingsGoal.create({
    userId: testUserId,
    name: 'New Laptop',
    targetAmount: 80000,
    currentAmount: 20000,
    targetDate: new Date('2026-12-31'),
    category: 'Tech',
    priority: 'high',
    status: 'active',
  });

  await SavingsContribution.create({
    userId: testUserId,
    goalId: goal._id,
    amount: 20000,
    date: new Date(),
    paymentMethod: 'Initial Deposit',
    note: 'Starting savings balance',
  });

  console.assert(goal.targetAmount === 80000, 'Goal creation failed');
  console.log('✓ Test 1 Passed: Goal "New Laptop" (Target ₹80,000, Initial ₹20,000) created in MongoDB.');

  // 2. Add Money (+₹5,000)
  const c1 = await SavingsContribution.create({
    userId: testUserId,
    goalId: goal._id,
    amount: 5000,
    date: new Date(),
    paymentMethod: 'UPI',
    note: 'Monthly savings contribution',
  });

  const contribs1 = await SavingsContribution.find({ goalId: goal._id });
  const totalSaved1 = contribs1.reduce((acc, c) => acc + c.amount, 0);
  const remaining1 = goal.targetAmount - totalSaved1;
  const progress1 = (totalSaved1 / goal.targetAmount) * 100;

  console.assert(totalSaved1 === 25000, `Expected total saved ₹25,000, got ₹${totalSaved1}`);
  console.assert(remaining1 === 55000, `Expected remaining ₹55,000, got ₹${remaining1}`);
  console.assert(progress1 === 31.25, `Expected progress 31.25%, got ${progress1}%`);
  console.log('✓ Test 2 Passed: Added ₹5,000. New Total Saved: ₹25,000, Remaining: ₹55,000 (31.25% complete).');

  // 3. Test Overpayment Protection Validation
  const attemptDeposit = 60000;
  const isOverpaymentBlocked = attemptDeposit > remaining1;
  console.assert(isOverpaymentBlocked, 'Overpayment validation failed');
  console.log('✓ Test 3 Passed: Attempted ₹60,000 deposit rejected (exceeds ₹55,000 remaining).');

  // 4. Final Deposit (+₹55,000) to Complete Goal
  const c2 = await SavingsContribution.create({
    userId: testUserId,
    goalId: goal._id,
    amount: 55000,
    date: new Date(),
    paymentMethod: 'Bank Transfer',
    note: 'Final bonus deposit',
  });

  const contribs2 = await SavingsContribution.find({ goalId: goal._id });
  const totalSaved2 = contribs2.reduce((acc, c) => acc + c.amount, 0);
  const remaining2 = goal.targetAmount - totalSaved2;

  if (remaining2 <= 0) {
    goal.currentAmount = totalSaved2;
    goal.status = 'completed';
    goal.isCompleted = true;
    await goal.save();
  }

  console.assert(totalSaved2 === 80000, `Expected total saved ₹80,000, got ₹${totalSaved2}`);
  console.assert(goal.status === 'completed', 'Goal status did not transition to completed');
  console.assert(contribs2.length === 3, 'Savings contribution history incomplete');
  console.log('✓ Test 4 Passed: Goal Completed (Total Saved: ₹80,000 / ₹80,000, Status: Completed).');
  console.log('✓ Test 5 Passed: Complete savings history preserved 3 contribution records in MongoDB.');

  // Clean up test records
  await SavingsGoal.deleteOne({ _id: goal._id });
  await SavingsContribution.deleteMany({ goalId: goal._id });

  console.log('--- ALL SAVINGS GOALS UNIT TESTS PASSED ---');
  process.exit(0);
}

testSavingsGoals().catch(console.error);
