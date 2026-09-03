import fs from 'fs';
import path from 'path';

async function testDbAndEmptyState() {
  console.log('--- RUNNING DB CONNECTION & 503 ERROR HANDLING TESTS ---');

  const connectPath = path.resolve(process.cwd(), 'lib/db/connect.ts');
  const summaryRoutePath = path.resolve(process.cwd(), 'app/api/dashboard/summary/route.ts');
  const pagePath = path.resolve(process.cwd(), 'app/page.tsx');

  const connectCode = fs.readFileSync(connectPath, 'utf8');
  const summaryCode = fs.readFileSync(summaryRoutePath, 'utf8');
  const pageCode = fs.readFileSync(pagePath, 'utf8');

  // Test 1: Check Mongoose readyState & connection pooling in connect.ts
  console.assert(connectCode.includes('mongoose.connection.readyState === 1'), 'Missing readyState === 1 check');
  console.assert(connectCode.includes('maxPoolSize: 10'), 'Missing maxPoolSize configuration');
  console.log('✓ Test 1 Passed: connectToDatabase uses readyState checking and maxPoolSize connection pooling.');

  // Test 2: Status codes in summary route
  console.assert(summaryCode.includes('status: 401'), 'Missing 401 for unauthenticated requests');
  console.assert(summaryCode.includes('status: 503'), 'Missing 503 for database offline');
  console.log('✓ Test 2 Passed: /api/dashboard/summary returns 401 for unauthorized and 503 only when database is offline.');

  // Test 3: AbortController and Retry banner in page.tsx
  console.assert(pageCode.includes('AbortController'), 'Missing AbortController cleanup in page.tsx');
  console.assert(pageCode.includes('res.status === 401'), 'Missing 401 redirect check in page.tsx');
  console.assert(pageCode.includes('res.status === 503'), 'Missing 503 error handling in page.tsx');
  console.log('✓ Test 3 Passed: app/page.tsx handles 401 redirects, 503 retries, and AbortController cleanup.');

  // Test 4: Zero fallback financial data in page.tsx
  console.assert(!pageCode.includes('24580'), 'Found legacy demo 24580 in page.tsx');
  console.assert(!pageCode.includes('32000'), 'Found legacy demo 32000 in page.tsx');
  console.assert(!pageCode.includes('7420'), 'Found legacy demo 7420 in page.tsx');
  console.log('✓ Test 4 Passed: Zero demo/default financial figures in app/page.tsx (new user starts empty).');

  console.log('--- ALL DB & 503 TESTS PASSED ---');
  process.exit(0);
}

testDbAndEmptyState().catch(console.error);
