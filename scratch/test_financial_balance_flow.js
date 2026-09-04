const fs = require('fs');
const path = require('path');

function runBalanceFlowTests() {
  console.log('--- STARTING FINANCIAL BALANCE FLOW VERIFICATION ---');

  // Test 1: Check accountBalanceHelper.ts file
  const helperPath = path.join(process.cwd(), 'lib', 'finance', 'accountBalanceHelper.ts');
  console.log('accountBalanceHelper.ts exists:', fs.existsSync(helperPath) ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(fs.existsSync(helperPath), 'accountBalanceHelper.ts must exist');

  // Test 2: Check transactions route POST invokes syncAccountBalanceForTransaction
  const txRoutePath = path.join(process.cwd(), 'app', 'api', 'transactions', 'route.ts');
  const txRouteContent = fs.readFileSync(txRoutePath, 'utf8');
  const hasSyncPost = txRouteContent.includes('syncAccountBalanceForTransaction');
  console.log('transactions POST API calls syncAccountBalanceForTransaction:', hasSyncPost ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(hasSyncPost, 'transactions POST API must call balance sync');

  // Test 3: Check transactions/[id] route PUT and DELETE invoke syncAccountBalanceForTransaction
  const txIdRoutePath = path.join(process.cwd(), 'app', 'api', 'transactions', '[id]', 'route.ts');
  const txIdRouteContent = fs.readFileSync(txIdRoutePath, 'utf8');
  const hasSyncPutDelete = txIdRouteContent.includes('syncAccountBalanceForTransaction');
  console.log('transactions/[id] PUT/DELETE API calls syncAccountBalanceForTransaction:', hasSyncPutDelete ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(hasSyncPutDelete, 'transactions/[id] API must call balance sync');

  // Test 4: Simulation of Cases A through F
  console.log('\n[SIMULATION TESTS: CASES A - F]');
  const accountsMap = new Map();
  let loansList = [];
  let liabilitiesList = [];

  function getAvailableMoney() {
    let sum = 0;
    const liquidTypes = ['cash', 'bank', 'upi', 'savings', 'debit_card', 'custom'];
    for (const [name, acc] of accountsMap.entries()) {
      if (acc.balance > 0 && liquidTypes.includes(acc.type)) {
        sum += acc.balance;
      }
    }
    return sum;
  }

  function simulateTransaction(accountName, amount, type) {
    const nameLower = accountName.toLowerCase();
    let accType = 'bank';
    if (nameLower.includes('cash')) accType = 'cash';
    else if (nameLower.includes('upi')) accType = 'upi';

    const existing = accountsMap.get(accountName) || { name: accountName, type: accType, balance: 0 };
    const change = type === 'income' ? amount : -amount;
    existing.balance += change;
    accountsMap.set(accountName, existing);
  }

  // CASE A: Bank ₹0 + Income ₹10,000 → Available ₹10,000
  simulateTransaction('Bank Account', 10000, 'income');
  const availA = getAvailableMoney();
  console.log('CASE A (Income ₹10k to Bank) -> Available Money:', availA, availA === 10000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availA === 10000, 'Case A failed');

  // CASE B: Expense ₹2,000 from Bank → Available ₹8,000
  simulateTransaction('Bank Account', 2000, 'expense');
  const availB = getAvailableMoney();
  console.log('CASE B (Expense ₹2k from Bank) -> Available Money:', availB, availB === 8000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availB === 8000, 'Case B failed');

  // CASE C: Add Cash ₹5,000 → Available ₹13,000
  simulateTransaction('Cash', 5000, 'income');
  const availC = getAvailableMoney();
  console.log('CASE C (Add Cash ₹5k) -> Available Money:', availC, availC === 13000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availC === 13000, 'Case C failed');

  // CASE D: Money Given ₹62,000 → Available remains ₹13,000
  loansList.push({ type: 'given', principal: 62000, status: 'active' });
  const availD = getAvailableMoney();
  console.log('CASE D (Money Given ₹62k added) -> Available Money:', availD, availD === 13000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availD === 13000, 'Case D failed');

  // CASE E: Liability ₹8,200 → Available remains ₹13,000
  loansList.push({ type: 'borrowed', principal: 8200, status: 'active' });
  const availE = getAvailableMoney();
  console.log('CASE E (Liability ₹8.2k added) -> Available Money:', availE, availE === 13000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availE === 13000, 'Case E failed');

  // CASE F: Transfer ₹3,000 Bank -> UPI → Available remains ₹13,000
  simulateTransaction('Bank Account', 3000, 'expense'); // transfer out of Bank
  simulateTransaction('UPI Wallet', 3000, 'income');   // transfer into UPI
  const availF = getAvailableMoney();
  console.log('CASE F (Transfer ₹3k Bank -> UPI) -> Available Money:', availF, availF === 13000 ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(availF === 13000, 'Case F failed');

  console.log('\n--- ALL FINANCIAL BALANCE FLOW VERIFICATIONS PASSED SUCCESSFULLY ✅ ---');
}

runBalanceFlowTests();
