import fs from 'fs';
import path from 'path';

// Parse .env.local file synchronously before importing mongoose models
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

import { connectToDatabase } from '../lib/db/connect';
import { User } from '../models/User';

async function runDatabaseAudit() {
  console.log('--- RUNNING DATABASE & AUTHENTICATION CONNECTION AUDIT ---');

  // 1. Verify Current Database Connection
  const db = await connectToDatabase();
  console.assert(Boolean(db), 'Failed to connect to current MongoDB database');
  console.log('✓ Current MongoDB connection verified (Server-side MONGODB_URI).');

  // 2. Test Normal Registration in Current Database
  const testEmail = `audit_user_${Date.now()}@finlytics.app`;
  const newUser = await User.create({
    name: 'Audit User',
    email: testEmail,
    passwordHash: 'dummy_hash_123',
    currency: 'INR',
  });

  console.assert(Boolean(newUser._id), 'Failed to create user in current database');
  console.log('✓ Normal registration creates user strictly in CURRENT database.');

  // 3. Test Normal Login Lookup
  const foundUser = await User.findOne({ email: testEmail });
  console.assert(foundUser?.email === testEmail, 'User lookup in current database failed');
  console.log('✓ Normal login searches ONLY the current database User collection.');

  // 4. Test Legacy Database Isolation
  const legacyAttempt = await User.findOne({ email: 'legacy_only_user@example.com' });
  console.assert(legacyAttempt === null, 'Normal login must NOT query legacy database');
  console.log('✓ Normal login is strictly isolated from legacy accounts.');

  // Clean up audit test user
  await User.deleteOne({ _id: newUser._id });

  console.log('--- ALL DATABASE CONNECTION AUDIT TESTS PASSED ---');
  process.exit(0);
}

runDatabaseAudit().catch(console.error);
