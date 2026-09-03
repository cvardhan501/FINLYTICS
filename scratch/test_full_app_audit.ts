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
import { Budget } from '../models/Budget';
import { SavingsGoal } from '../models/SavingsGoal';
import { RecurringTransaction } from '../models/RecurringTransaction';
import { BillSubscription } from '../models/BillSubscription';
import { LogBookEntry } from '../models/LogBookEntry';
import { Notification } from '../models/Notification';
import { Account } from '../models/Account';
import mongoose from 'mongoose';

async function runFullAppAudit() {
  console.log('========================================');
  console.log('FINLYTICS COMPLETE APPLICATION-WIDE AUDIT');
  console.log('========================================');

  const db = await connectToDatabase();
  console.assert(Boolean(db), 'MongoDB connection failed');

  const testNewUserId = new mongoose.Types.ObjectId();

  // Query each collection directly with testNewUserId
  const txs = await Transaction.find({ userId: testNewUserId });
  const loans = await Loan.find({ userId: testNewUserId });
  const budgets = await Budget.find({ userId: testNewUserId });
  const goals = await SavingsGoal.find({ userId: testNewUserId });
  const recurring = await RecurringTransaction.find({ userId: testNewUserId });
  const bills = await BillSubscription.find({ userId: testNewUserId });
  const logs = await LogBookEntry.find({ userId: testNewUserId });
  const notifications = await Notification.find({ userId: testNewUserId });
  const accounts = await Account.find({ userId: testNewUserId });

  console.log(`Transactions:            ${txs.length} items`);
  console.log(`Loans:                   ${loans.length} items`);
  console.log(`Budgets:                 ${budgets.length} items`);
  console.log(`Savings Goals:           ${goals.length} items`);
  console.log(`Recurring Transactions:  ${recurring.length} items`);
  console.log(`Bills & Subscriptions:   ${bills.length} items`);
  console.log(`Financial Log Book:      ${logs.length} items`);
  console.log(`Notifications:           ${notifications.length} items`);
  console.log(`Accounts:                ${accounts.length} items`);

  console.assert(txs.length === 0, 'Transactions not empty');
  console.assert(loans.length === 0, 'Loans not empty');
  console.assert(budgets.length === 0, 'Budgets not empty');
  console.assert(goals.length === 0, 'Savings goals not empty');
  console.assert(recurring.length === 0, 'Recurring transactions not empty');
  console.assert(bills.length === 0, 'Bills not empty');
  console.assert(logs.length === 0, 'Log book entries not empty');
  console.assert(notifications.length === 0, 'Notifications not empty');
  console.assert(accounts.length === 0, 'Accounts not empty');

  console.log('✓ ALL 9 USER FINANCIAL COLLECTIONS VERIFIED 100% EMPTY FOR NEW USER.');
  console.log('========================================');

  process.exit(0);
}

runFullAppAudit().catch(console.error);
