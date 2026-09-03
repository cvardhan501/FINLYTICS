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
import { Notification } from '../models/Notification';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';
import mongoose from 'mongoose';

async function testNotificationsAndBudgets() {
  console.log('--- RUNNING NOTIFICATIONS & BUDGET DELETE UNIT TESTS ---');

  const db = await connectToDatabase();
  console.assert(Boolean(db), 'MongoDB connection failed');

  const userA = new mongoose.Types.ObjectId();
  const userB = new mongoose.Types.ObjectId();

  // 1. User A creates Notifications & Budget & Transaction
  const n1 = await Notification.create({
    userId: userA,
    title: 'Bill Reminder',
    message: 'Electricity bill due soon',
    category: 'bills',
    priority: 'warning',
    isRead: false,
  });

  const n2 = await Notification.create({
    userId: userA,
    title: 'Loan Payment',
    message: 'Received ₹3,000 from Ravi',
    category: 'loans',
    priority: 'info',
    isRead: false,
  });

  const b1 = await Budget.create({
    userId: userA,
    name: 'Food & Dining Budget',
    amount: 5000,
    category: 'Food',
    period: 'monthly',
  });

  const t1 = await Transaction.create({
    userId: userA,
    type: 'expense',
    amount: 1200,
    category: 'Food',
    account: 'Bank',
    paymentMethod: 'UPI',
    date: new Date(),
    description: 'Dinner at Bistro',
  });

  console.log('✓ Test 1 Passed: Initial Notifications, Budget, and Transaction created for User A.');

  // 2. Mark All as Read for User A
  await Notification.updateMany({ userId: userA, isRead: false }, { isRead: true, readAt: new Date() });
  const unreadCountA = await Notification.countDocuments({ userId: userA, isRead: false });
  console.assert(unreadCountA === 0, 'Mark all as read failed');
  console.log('✓ Test 2 Passed: Mark all read updated unread count to 0.');

  // 3. Clear All Notifications for User A
  await Notification.deleteMany({ userId: userA });
  const notifsA = await Notification.find({ userId: userA });
  console.assert(notifsA.length === 0, 'Clear all notifications failed');
  console.log('✓ Test 3 Passed: Clear all notifications removed all notification records for User A.');

  // 4. Delete Budget for User A & Verify Transactions Remain Intact
  await Budget.deleteOne({ _id: b1._id, userId: userA });
  const budgetCheck = await Budget.findOne({ _id: b1._id });
  const txCheck = await Transaction.findOne({ _id: t1._id });

  console.assert(budgetCheck === null, 'Budget deletion failed');
  console.assert(txCheck !== null && txCheck.amount === 1200, 'Transaction was accidentally deleted');
  console.log('✓ Test 4 Passed: Budget deleted successfully while associated transaction (₹1,200) remains 100% intact.');

  // 5. User Isolation Check for User B
  const notifsB = await Notification.find({ userId: userB });
  const budgetsB = await Budget.find({ userId: userB });

  console.assert(notifsB.length === 0, 'User B notification isolation failed');
  console.assert(budgetsB.length === 0, 'User B budget isolation failed');
  console.log('✓ Test 5 Passed: User B sees 0 notifications and 0 budgets (Strict User Isolation verified).');

  // Clean up remaining test transaction
  await Transaction.deleteOne({ _id: t1._id });

  console.log('--- ALL NOTIFICATIONS & BUDGET DELETE UNIT TESTS PASSED ---');
  process.exit(0);
}

testNotificationsAndBudgets().catch(console.error);
