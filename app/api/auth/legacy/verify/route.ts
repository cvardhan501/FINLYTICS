import { NextRequest, NextResponse } from 'next/server';
import { verifyLegacyCredentials } from '@/lib/services/legacyMigrationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and old password are required' }, { status: 400 });
    }

    const result = await verifyLegacyCredentials(username, password);

    if (!result.verified) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: result.isAlreadyMigrated ? 409 : 401 }
      );
    }

    return NextResponse.json({
      verified: true,
      migrationToken: result.migrationToken,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to verify legacy credentials' }, { status: 500 });
  }
}
