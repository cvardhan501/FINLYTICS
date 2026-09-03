import { NextRequest, NextResponse } from 'next/server';
import { getLegacyRestorePreview } from '@/lib/services/legacyMigrationService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { migrationToken } = body;

    if (!migrationToken) {
      return NextResponse.json({ error: 'Migration token is required' }, { status: 400 });
    }

    const preview = await getLegacyRestorePreview(migrationToken);
    if (!preview) {
      return NextResponse.json({ error: 'Invalid or expired migration token' }, { status: 401 });
    }

    return NextResponse.json(preview);
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to inspect legacy data preview' }, { status: 500 });
  }
}
