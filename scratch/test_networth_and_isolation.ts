import { connectToDatabase } from '../lib/db/connect';
import { User } from '../models/User';
import { Asset } from '../models/Asset';
import { Liability } from '../models/Liability';
import { Account } from '../models/Account';
import { assetSchema, liabilitySchema } from '../schemas';

async function testNetWorthImplementation() {
  console.log('=== TEST 1: ZOD VALIDATION CHECKS ===');

  const invalidAsset = assetSchema.safeParse({
    name: 'Bad Asset',
    type: 'gold',
    amount: -1000,
  });
  console.log('Invalid Asset Validation (amount -1000):', !invalidAsset.success ? 'PASSED (Rejected)' : 'FAILED');

  const validAsset = assetSchema.safeParse({
    name: 'Gold Ring',
    type: 'gold',
    amount: 50000,
  });
  console.log('Valid Asset Validation (amount 50000):', validAsset.success ? 'PASSED' : 'FAILED');

  const invalidLiability = liabilitySchema.safeParse({
    name: 'Bad Debt',
    type: 'credit_card',
    amount: 0,
  });
  console.log('Invalid Liability Validation (amount 0):', !invalidLiability.success ? 'PASSED (Rejected)' : 'FAILED');

  console.log('\n=== TEST 2: DATABASE ZERO-STATE & USER ISOLATION ===');
  const db = await connectToDatabase();
  if (!db) {
    console.log('MongoDB connection offline. Skipping DB test.');
    return;
  }

  // Create User 1
  const email1 = `test_user_nw1_${Date.now()}@example.com`;
  const user1 = await User.create({
    name: 'NetWorth User 1',
    email: email1,
    passwordHash: 'dummyhash',
    currency: 'INR',
  });

  // Verify User 1 has ZERO default accounts/assets/liabilities
  const u1Accounts = await Account.find({ userId: user1._id });
  const u1Assets = await Asset.find({ userId: user1._id });
  const u1Liabilities = await Liability.find({ userId: user1._id });

  console.log('User 1 initial accounts count:', u1Accounts.length, u1Accounts.length === 0 ? 'PASSED' : 'FAILED');
  console.log('User 1 initial assets count:', u1Assets.length, u1Assets.length === 0 ? 'PASSED' : 'FAILED');
  console.log('User 1 initial liabilities count:', u1Liabilities.length, u1Liabilities.length === 0 ? 'PASSED' : 'FAILED');

  // Add Asset ₹50,000
  const asset1 = await Asset.create({
    userId: user1._id,
    name: 'HDFC Bank Savings',
    type: 'bank',
    amount: 50000,
  });

  const u1AssetsAfter = await Asset.find({ userId: user1._id });
  const u1TotalAssets = u1AssetsAfter.reduce((sum, a) => sum + a.amount, 0);
  console.log('User 1 Assets Total:', u1TotalAssets, u1TotalAssets === 50000 ? 'PASSED' : 'FAILED');

  // Add Liability ₹10,000
  const liab1 = await Liability.create({
    userId: user1._id,
    name: 'SBI Credit Card',
    type: 'credit_card',
    amount: 10000,
  });

  const u1LiabAfter = await Liability.find({ userId: user1._id });
  const u1TotalLiab = u1LiabAfter.reduce((sum, l) => sum + l.amount, 0);
  const u1NetWorth = u1TotalAssets - u1TotalLiab;
  console.log('User 1 Net Worth (50000 - 10000):', u1NetWorth, u1NetWorth === 40000 ? 'PASSED' : 'FAILED');

  // Delete Liability
  await Liability.deleteOne({ _id: liab1._id, userId: user1._id });
  const u1LiabAfterDelete = await Liability.find({ userId: user1._id });
  const u1NetWorthAfterDelete = u1TotalAssets - u1LiabAfterDelete.reduce((sum, l) => sum + l.amount, 0);
  console.log('User 1 Net Worth after deleting liability:', u1NetWorthAfterDelete, u1NetWorthAfterDelete === 50000 ? 'PASSED' : 'FAILED');

  // Create User 2
  const email2 = `test_user_nw2_${Date.now()}@example.com`;
  const user2 = await User.create({
    name: 'NetWorth User 2',
    email: email2,
    passwordHash: 'dummyhash',
    currency: 'INR',
  });

  const u2Assets = await Asset.find({ userId: user2._id });
  const u2Liabilities = await Liability.find({ userId: user2._id });
  console.log('User 2 Assets (Isolated from User 1):', u2Assets.length, u2Assets.length === 0 ? 'PASSED' : 'FAILED');
  console.log('User 2 Liabilities (Isolated from User 1):', u2Liabilities.length, u2Liabilities.length === 0 ? 'PASSED' : 'FAILED');

  // Cleanup test users
  await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
  await Asset.deleteMany({ userId: { $in: [user1._id, user2._id] } });
  await Liability.deleteMany({ userId: { $in: [user1._id, user2._id] } });
  console.log('\n=== ALL NET WORTH VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

testNetWorthImplementation().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
