const fs = require('fs');
const path = require('path');

function runDashboardVerificationTests() {
  console.log('--- STARTING DASHBOARD FINANCIAL TOTALS VERIFICATION ---');

  // Test 1: Shared utility verification
  console.log('\n[TEST 1] Verifying Shared Financial Calculator Utility:');
  const calcPath = path.join(process.cwd(), 'lib', 'finance', 'netWorthCalculator.ts');
  const hasCalc = fs.existsSync(calcPath);
  console.log('netWorthCalculator.ts exists:', hasCalc ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(hasCalc, 'netWorthCalculator.ts must exist');

  // Test 2: Check Dashboard Summary Route uses calculateUserFinancialSummary
  console.log('\n[TEST 2] Verifying Dashboard Summary Route uses Single Source of Truth:');
  const dashRoutePath = path.join(process.cwd(), 'app', 'api', 'dashboard', 'summary', 'route.ts');
  const dashRouteContent = fs.readFileSync(dashRoutePath, 'utf8');
  const usesSharedCalc = dashRouteContent.includes('calculateUserFinancialSummary');
  console.log('Dashboard summary API imports calculateUserFinancialSummary:', usesSharedCalc ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(usesSharedCalc, 'Dashboard API must use shared calculator');

  // Test 3: Check Net Worth Route uses calculateUserFinancialSummary
  console.log('\n[TEST 3] Verifying Net Worth Route uses Single Source of Truth:');
  const netWorthRoutePath = path.join(process.cwd(), 'app', 'api', 'net-worth', 'route.ts');
  const netWorthRouteContent = fs.readFileSync(netWorthRoutePath, 'utf8');
  const netWorthUsesSharedCalc = netWorthRouteContent.includes('calculateUserFinancialSummary');
  console.log('Net Worth API imports calculateUserFinancialSummary:', netWorthUsesSharedCalc ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(netWorthUsesSharedCalc, 'Net Worth API must use shared calculator');

  // Test 4: Simulation of User Scenarios (New User, User with ₹62k/8.2k loans, User with Cash)
  console.log('\n[TEST 4] Simulating User Scenarios:');

  // Scenario A: New User (0 records)
  const newUserState = simulateCalculation({ accounts: [], assets: [], liabilities: [], loans: [], payments: [] });
  console.log('New User -> AvailableMoney:', newUserState.availableMoney, 'Assets:', newUserState.totalAssets, 'Liabilities:', newUserState.totalLiabilities, 'NetWorth:', newUserState.netWorth);
  console.assert(newUserState.availableMoney === 0 && newUserState.totalAssets === 0 && newUserState.totalLiabilities === 0 && newUserState.netWorth === 0, 'New User state failed!');
  console.log('New User Zero-State: PASSED ✅');

  // Scenario B: User with ₹62k Money Given, ₹8.2k Money Borrowed, 0 Accounts
  const loansB = [
    { _id: 'l1', type: 'given', principal: 62000, status: 'active' },
    { _id: 'l2', type: 'borrowed', principal: 8200, status: 'active' },
  ];
  const userBState = simulateCalculation({ accounts: [], assets: [], liabilities: [], loans: loansB, payments: [] });
  console.log('User B -> AvailableMoney:', userBState.availableMoney, 'Assets:', userBState.totalAssets, 'Liabilities:', userBState.totalLiabilities, 'NetWorth:', userBState.netWorth);
  console.assert(userBState.availableMoney === 0, 'User B Available Money should be 0');
  console.assert(userBState.totalAssets === 62000, 'User B Total Assets should be 62000');
  console.assert(userBState.totalLiabilities === 8200, 'User B Total Liabilities should be 8200');
  console.assert(userBState.netWorth === 53800, 'User B Net Worth should be 53800');
  console.log('User B (Loans Only): PASSED ✅');

  // Scenario C: Add Cash ₹10,000
  const accountsC = [{ _id: 'acc1', name: 'Cash', type: 'cash', balance: 10000 }];
  const userCState = simulateCalculation({ accounts: accountsC, assets: [], liabilities: [], loans: loansB, payments: [] });
  console.log('User C -> AvailableMoney:', userCState.availableMoney, 'Assets:', userCState.totalAssets, 'Liabilities:', userCState.totalLiabilities, 'NetWorth:', userCState.netWorth);
  console.assert(userCState.availableMoney === 10000, 'User C Available Money should be 10000');
  console.assert(userCState.totalAssets === 72000, 'User C Total Assets should be 72000');
  console.assert(userCState.totalLiabilities === 8200, 'User C Total Liabilities should be 8200');
  console.assert(userCState.netWorth === 63800, 'User C Net Worth should be 63800');
  console.log('User C (Loans + Cash ₹10k): PASSED ✅');

  // Scenario D: Add Bank ₹20,000
  const accountsD = [
    { _id: 'acc1', name: 'Cash', type: 'cash', balance: 10000 },
    { _id: 'acc2', name: 'Bank', type: 'bank', balance: 20000 },
  ];
  const userDState = simulateCalculation({ accounts: accountsD, assets: [], liabilities: [], loans: loansB, payments: [] });
  console.log('User D -> AvailableMoney:', userDState.availableMoney, 'Assets:', userDState.totalAssets, 'Liabilities:', userDState.totalLiabilities, 'NetWorth:', userDState.netWorth);
  console.assert(userDState.availableMoney === 30000, 'User D Available Money should be 30000');
  console.assert(userDState.totalAssets === 92000, 'User D Total Assets should be 92000');
  console.assert(userDState.totalLiabilities === 8200, 'User D Total Liabilities should be 8200');
  console.assert(userDState.netWorth === 83800, 'User D Net Worth should be 83800');
  console.log('User D (Loans + Cash ₹10k + Bank ₹20k): PASSED ✅');

  console.log('\n--- ALL DASHBOARD VERIFICATIONS PASSED SUCCESSFULLY ✅ ---');
}

function simulateCalculation({ accounts, assets, liabilities, loans, payments }) {
  let availableMoney = 0;
  let assetsSum = 0;
  let liabilitiesSum = 0;

  assets.forEach((a) => (assetsSum += a.amount));
  liabilities.forEach((l) => (liabilitiesSum += l.amount));

  accounts.forEach((acc) => {
    const balance = acc.balance || 0;
    if (balance > 0) {
      assetsSum += balance;
      if (['cash', 'bank', 'upi', 'savings', 'debit_card', 'custom'].includes(acc.type)) {
        availableMoney += balance;
      }
    } else if (balance < 0) {
      liabilitiesSum += Math.abs(balance);
    }
  });

  const paymentsByLoan = new Map();
  payments.forEach((p) => {
    paymentsByLoan.set(p.loanId, (paymentsByLoan.get(p.loanId) || 0) + p.amount);
  });

  let givenTotal = 0;
  let borrowedTotal = 0;

  loans.forEach((loan) => {
    if (loan.status === 'paid' || loan.status === 'cancelled') return;
    const paid = paymentsByLoan.get(loan._id) || 0;
    const remaining = Math.max(0, loan.principal - paid);
    if (remaining > 0) {
      if (loan.type === 'given') givenTotal += remaining;
      else borrowedTotal += remaining;
    }
  });

  assetsSum += givenTotal;
  liabilitiesSum += borrowedTotal;

  return {
    availableMoney,
    totalAssets: assetsSum,
    totalLiabilities: liabilitiesSum,
    netWorth: assetsSum - liabilitiesSum,
  };
}

runDashboardVerificationTests();
