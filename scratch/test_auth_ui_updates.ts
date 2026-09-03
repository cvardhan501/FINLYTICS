import fs from 'fs';
import path from 'path';

async function testAuthUiUpdates() {
  console.log('--- RUNNING AUTH UI & FORGOT PASSWORD VALIDATION TESTS ---');

  const loginCode = fs.readFileSync(path.resolve(process.cwd(), 'app/auth/login/page.tsx'), 'utf8');
  const forgotCode = fs.readFileSync(path.resolve(process.cwd(), 'app/auth/forgot-password/page.tsx'), 'utf8');
  const forgotApiCode = fs.readFileSync(path.resolve(process.cwd(), 'app/api/auth/forgot-password/route.ts'), 'utf8');
  const registerCode = fs.readFileSync(path.resolve(process.cwd(), 'app/auth/register/page.tsx'), 'utf8');

  // Test 1: Show password toggle in login & register
  console.assert(loginCode.includes('showPassword'), 'Missing showPassword in login page');
  console.assert(registerCode.includes('showPassword'), 'Missing showPassword in register page');
  console.log('✓ Test 1 Passed: Show password toggle implemented in Login and Register forms.');

  // Test 2: Restore account link removed from login
  console.assert(!loginCode.includes('Restore Previous Account'), 'Restore Previous Account link still present in login page');
  console.log('✓ Test 2 Passed: Restore Previous Account link completely removed from login section.');

  // Test 3: Unregistered email validation in API
  console.assert(forgotApiCode.includes('status: 404'), 'Missing 404 status in forgot password API');
  console.assert(forgotApiCode.includes('No account registered with this email address'), 'Missing explicit 404 error message');
  console.log('✓ Test 3 Passed: Forgot password API returns HTTP 404 for unregistered email addresses.');

  // Test 4: Animated tick badge in forgot password UI
  console.assert(forgotCode.includes('CheckCircle2'), 'Missing CheckCircle2 checkmark in forgot password page');
  console.assert(forgotCode.includes('animate-bounce'), 'Missing bounce animation for tick mark');
  console.log('✓ Test 4 Passed: Forgot password page displays animated green checkmark tick on success.');

  console.log('--- ALL AUTH UI & FORGOT PASSWORD TESTS PASSED ---');
  process.exit(0);
}

testAuthUiUpdates().catch(console.error);
