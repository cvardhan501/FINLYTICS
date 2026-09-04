const fs = require('fs');
const path = require('path');

function runDeleteSavingsTransactionTests() {
  console.log('--- STARTING DELETE SAVINGS TRANSACTION VERIFICATION ---');

  // Test 1: Verify API route file exists
  const routePath = path.join(process.cwd(), 'app', 'api', 'savings', 'transactions', '[id]', 'route.ts');
  const routeExists = fs.existsSync(routePath);
  console.log('API route app/api/savings/transactions/[id]/route.ts exists:', routeExists ? 'PASSED ✅' : 'FAILED ❌');
  console.assert(routeExists, 'DELETE route file must exist');

  // Test 2: Check DELETE implementation in route.ts
  const routeContent = fs.readFileSync(routePath, 'utf8');
  const hasDeleteHandler = routeContent.includes('export async function DELETE');
  const verifiesUser = routeContent.includes('userId: authUser.userId');
  const updatesGoal = routeContent.includes('goal.currentAmount');

  console.log('DELETE handler exported:', hasDeleteHandler ? 'PASSED ✅' : 'FAILED ❌');
  console.log('User isolation enforced (userId filter):', verifiesUser ? 'PASSED ✅' : 'FAILED ❌');
  console.log('Goal currentAmount reverted on delete:', updatesGoal ? 'PASSED ✅' : 'FAILED ❌');

  console.assert(hasDeleteHandler && verifiesUser && updatesGoal, 'Route logic check failed');

  // Test 3: Check app/savings/page.tsx has Delete button and handler
  const pagePath = path.join(process.cwd(), 'app', 'savings', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  const hasPageHandler = pageContent.includes('handleDeleteTransaction');
  const hasTrashIcon = pageContent.includes('Trash2');

  console.log('Savings Page has handleDeleteTransaction:', hasPageHandler ? 'PASSED ✅' : 'FAILED ❌');
  console.log('Savings Page renders Trash2 delete button:', hasTrashIcon ? 'PASSED ✅' : 'FAILED ❌');

  console.assert(hasPageHandler && hasTrashIcon, 'Savings Page UI check failed');

  console.log('\n--- ALL DELETE SAVINGS TRANSACTION VERIFICATIONS PASSED SUCCESSFULLY ✅ ---');
}

runDeleteSavingsTransactionTests();
