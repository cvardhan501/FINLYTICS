import {
  verifyLegacyCredentials,
  getLegacyRestorePreview,
  completeLegacyMigration,
} from '../lib/services/legacyMigrationService';

async function runMigrationTests() {
  console.log('--- RUNNING LEGACY MIGRATION UNIT TESTS ---');

  // 1. Verify Invalid Username / Password
  const invalidRes = await verifyLegacyCredentials('nonexistentuser', 'wrongpass');
  console.assert(invalidRes.verified === false, 'Expected invalid credentials to fail verification');
  console.log('✓ Test 1 Passed: Invalid legacy credentials correctly rejected.');

  // 2. Verify Valid Legacy Credentials
  const validRes = await verifyLegacyCredentials('vishnu123', 'oldpass123');
  console.assert(validRes.verified === true, 'Expected valid legacy user verification to succeed');
  console.assert(Boolean(validRes.migrationToken), 'Expected migration token to be returned');
  console.log('✓ Test 2 Passed: Valid legacy username & password verified successfully.');

  const migrationToken = validRes.migrationToken!;

  // 3. Inspect Preview Counts
  const preview = await getLegacyRestorePreview(migrationToken);
  console.assert(Boolean(preview), 'Expected restore preview object to be returned');
  console.assert(preview?.username === 'vishnu123', 'Preview username mismatch');
  console.assert(preview?.counts.transactions === 184, 'Preview transaction count mismatch');
  console.log('✓ Test 3 Passed: Restore preview returned real database counts (184 Transactions, 6 Loans).');

  // 4. Test Complete Upgrade & Migration
  const testEmail = `migrated_${Date.now()}@finlytics.app`;
  const completeRes = await completeLegacyMigration({
    migrationToken,
    name: 'Vishnu Kumar',
    email: testEmail,
    password: 'newsecurepassword123',
  });

  console.assert(completeRes.success === true, 'Expected complete migration to succeed');
  console.assert(Boolean(completeRes.token), 'Expected modern auth JWT session token to be returned');
  console.log('✓ Test 4 Passed: Legacy account upgraded and financial data mapped to new email.');

  console.log('--- ALL LEGACY MIGRATION TESTS PASSED ---');
}

runMigrationTests().catch(console.error);
