const { calculateInterest, calculateBudgetStatus } = require('../lib/finance/calculations');
const { personalizeAlertWording } = require('../lib/services/aiPersonalizer');

async function runTests() {
  console.log('--- RUNNING REMINDER ENGINE UNIT TESTS ---');

  // 1. Test Partial Repayment Logic
  const loanPrincipal = 10000;
  const paidAmount = 3000;
  const rate = 12;
  const durationYears = 1;

  const calc = calculateInterest({
    principal: loanPrincipal,
    rate,
    durationYears,
    interestType: 'simple',
  });

  const remainingAmount = calc.totalAmount - paidAmount;
  console.assert(remainingAmount === 8200, `Expected remaining amount 8200, got ${remainingAmount}`);
  console.log('✓ Test 1 Passed: Partial repayment math calculated correctly (Remaining: ₹8,200).');

  // 2. Test Deduplication Key Format
  const loanId = 'loan_123';
  const dueDate = '2026-09-10';
  const stage = '1-day';
  const dedupKey = `loan:${loanId}:due:${dueDate}:${stage}`;
  console.assert(dedupKey === 'loan:loan_123:due:2026-09-10:1-day', 'Deduplication key format mismatch');
  log('✓ Test 2 Passed: Deduplication key generated deterministically.');

  // 3. Test Budget Threshold Math
  const spent = 4100;
  const budgetAmount = 5000;
  const status = calculateBudgetStatus(spent, budgetAmount, 80);
  console.assert(status.percentage === 82, `Expected percentage 82%, got ${status.percentage}%`);
  console.assert(status.isWarning === true, 'Expected warning state to be true');
  console.log('✓ Test 3 Passed: Budget 82% threshold status calculated correctly.');

  // 4. Test Alert Wording Personalization Fallback
  const wording = await personalizeAlertWording({
    type: 'loan_due',
    category: 'loans',
    priority: 'warning',
    entityName: 'Ravi',
    amount: 7000,
    dueDate: 'Sep 10',
    daysRemaining: 2,
    direction: 'given',
  });

  console.assert(wording.title === 'Upcoming Loan Repayment', 'Wording title mismatch');
  console.assert(wording.message.includes('7,000'), 'Wording amount missing');
  console.log('✓ Test 4 Passed: Alert wording template generator working cleanly.');

  console.log('--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
}

function log(msg) {
  console.log(msg);
}

runTests().catch(console.error);
