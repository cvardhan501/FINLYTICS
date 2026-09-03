import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { PasswordResetToken } from '@/models/PasswordResetToken';
import { hashToken, hashPassword } from '@/lib/auth/passwords';
import { resetPasswordSchema } from '@/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid password or token format' }, { status: 400 });
    }

    const { token, newPassword } = result.data;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ message: 'Password reset successfully (mock mode).' });
    }

    const hashedToken = hashToken(token);
    const tokenDoc = await PasswordResetToken.findOne({
      tokenHash: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token. Please request a new link.' },
        { status: 400 }
      );
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Mark reset token as used
    tokenDoc.used = true;
    await tokenDoc.save();

    return NextResponse.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
