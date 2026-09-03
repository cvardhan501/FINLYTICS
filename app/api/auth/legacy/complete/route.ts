import { NextRequest, NextResponse } from 'next/server';
import { completeLegacyMigration } from '@/lib/services/legacyMigrationService';
import { getAuthCookieOptions } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { migrationToken, name, email, password } = body;

    if (!migrationToken || !email || !password) {
      return NextResponse.json(
        { error: 'Migration token, email and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const result = await completeLegacyMigration({
      migrationToken,
      name: name || '',
      email,
      password,
    });

    if (!result.success || !result.token) {
      return NextResponse.json(
        { error: result.error || 'Migration failed' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      message: 'Account restored and upgraded successfully!',
      user: result.user,
      counts: result.counts,
    });

    // Set secure auth cookie
    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, result.token, cookieOpts);

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to complete migration' }, { status: 500 });
  }
}
