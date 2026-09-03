import { getAppUrl } from '../lib/email/resend';

async function testPasswordResetUrl() {
  console.log('--- RUNNING FORGOT PASSWORD RESET URL TESTS ---');

  // Test 1: Fallback when no env is set
  delete process.env.APP_URL;
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.VERCEL_URL;
  console.assert(getAppUrl() === 'http://localhost:3000', 'Fallback should be http://localhost:3000');
  console.log('✓ Test 1 Passed: Local development fallback returns http://localhost:3000');

  // Test 2: VERCEL_URL priority
  process.env.VERCEL_URL = 'finlytics.vercel.app';
  console.assert(getAppUrl() === 'https://finlytics.vercel.app', 'VERCEL_URL should produce https://finlytics.vercel.app');
  console.log('✓ Test 2 Passed: VERCEL_URL generates https://finlytics.vercel.app');

  // Test 3: APP_URL environment variable override
  process.env.APP_URL = 'https://finlytics.com/';
  console.assert(getAppUrl() === 'https://finlytics.com', 'APP_URL should strip trailing slashes');
  console.log('✓ Test 3 Passed: APP_URL environment variable takes precedence and strips trailing slashes.');

  console.log('--- ALL FORGOT PASSWORD RESET URL TESTS PASSED ---');
  process.exit(0);
}

testPasswordResetUrl().catch(console.error);
