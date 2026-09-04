import mongoose from 'mongoose';
import { Account, AccountType } from '@/models/Account';

/**
 * Synchronizes Account balance when a transaction is added, updated, or deleted.
 * 
 * @param userId - Authenticated user ID
 * @param accountName - Name or identifier of the account (e.g., 'Bank Account', 'Cash', 'UPI Wallet')
 * @param amount - Transaction amount
 * @param type - 'income' or 'expense'
 * @param multiplier - 1 to apply balance change, -1 to revert balance change
 */
export async function syncAccountBalanceForTransaction(
  userId: string,
  accountName: string,
  amount: number,
  type: 'income' | 'expense',
  multiplier: 1 | -1 = 1
) {
  if (!accountName || !amount || amount <= 0) return null;

  const balanceChange = (type === 'income' ? amount : -amount) * multiplier;
  const nameTrimmed = accountName.trim();
  const nameLower = nameTrimmed.toLowerCase();

  let accountType: AccountType = 'bank';
  if (nameLower.includes('cash')) accountType = 'cash';
  else if (nameLower.includes('upi')) accountType = 'upi';
  else if (nameLower.includes('credit')) accountType = 'credit_card';
  else if (nameLower.includes('savings')) accountType = 'savings';
  else if (nameLower.includes('debit')) accountType = 'debit_card';

  // Case-insensitive match on account name for this user
  const regex = new RegExp(`^${nameTrimmed.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
  
  let existingAccount = await Account.findOne({
    userId,
    name: { $regex: regex },
  });

  if (!existingAccount && mongoose.Types.ObjectId.isValid(accountName)) {
    existingAccount = await Account.findOne({ userId, _id: accountName });
  }

  if (existingAccount) {
    existingAccount.balance = (existingAccount.balance || 0) + balanceChange;
    await existingAccount.save();
    return existingAccount;
  } else {
    // Create new Account record with initial balance equal to balanceChange
    const newAccount = await Account.create({
      userId,
      name: nameTrimmed,
      type: accountType,
      balance: balanceChange,
      currency: 'INR',
      isDefault: false,
    });
    return newAccount;
  }
}
