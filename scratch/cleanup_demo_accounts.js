const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=').trim();
      process.env[key.trim()] = val;
    }
  });
}

const AccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const LoanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    personName: { type: String, required: true },
    type: { type: String, required: true },
    principal: { type: Number, required: true },
    status: { type: String, default: 'active' },
  },
  { timestamps: true }
);

const LiabilitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

const Account = mongoose.models.Account || mongoose.model('Account', AccountSchema);
const Loan = mongoose.models.Loan || mongoose.model('Loan', LoanSchema);
const Liability = mongoose.models.Liability || mongoose.model('Liability', LiabilitySchema);

async function runCleanup() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  console.log('Connected successfully!');

  // Target specific demo account patterns:
  // Cash ₹5,000, Bank ₹58,000, UPI ₹2,000
  const demoAccountsFilter = {
    $or: [
      { balance: 5000 },
      { balance: 58000 },
      { balance: 2000 },
    ],
  };

  const demoAccounts = await Account.find(demoAccountsFilter);
  console.log(`Found ${demoAccounts.length} demo accounts matching target values (5000, 58000, 2000):`);

  demoAccounts.forEach((acc) => {
    console.log(`- ID: ${acc._id} | User: ${acc.userId} | Name: "${acc.name}" | Type: ${acc.type} | Balance: ₹${acc.balance}`);
  });

  if (demoAccounts.length === 0) {
    console.log('\nNo matching demo accounts found in database.');
  } else {
    // Perform deletion of only these specific accounts
    const deleteResult = await Account.deleteMany(demoAccountsFilter);
    console.log(`\nDeleted ${deleteResult.deletedCount} demo account documents safely.`);
  }

  // Verification checks:
  console.log('\n--- VERIFICATION CHECKS ---');

  // 1. Verify ₹62,000 Money Given loan remains intact
  const loansGiven62k = await Loan.find({ type: 'given', principal: 62000 });
  console.log(`Active ₹62,000 Money Given Loans in DB: ${loansGiven62k.length}`);
  loansGiven62k.forEach((l) => {
    console.log(`  Loan ID: ${l._id} | Person: "${l.personName}" | Principal: ₹${l.principal} | Status: ${l.status}`);
  });

  // 2. Total active loans count
  const totalLoans = await Loan.countDocuments();
  console.log(`Total Loans intact in DB: ${totalLoans}`);

  // 3. Total liabilities count
  const totalLiabilities = await Liability.countDocuments();
  console.log(`Total Liabilities intact in DB: ${totalLiabilities}`);

  // 4. Remaining accounts count
  const remainingAccounts = await Account.countDocuments();
  console.log(`Remaining Accounts in DB: ${remainingAccounts}`);

  await mongoose.disconnect();
  console.log('\nDisconnected from MongoDB. Cleanup completed safely!');
}

runCleanup().catch((err) => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
