import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { PasswordResetToken } from '@/models/PasswordResetToken';
import { generateRandomToken } from '@/lib/auth/passwords';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { forgotPasswordSchema } from '@/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
    }

    const { email } = result.data;
    const genericResponse = NextResponse.json({
      message: 'If an account exists for this email, a password reset link has been sent.',
    });

    const db = await connectToDatabase();
    if (!db) {
      // In-memory fallback
      const { rawToken } = generateRandomToken();
      await sendPasswordResetEmail(email, rawToken);
      return genericResponse;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return generic message to prevent email enumeration
      return genericResponse;
    }

    // Invalidate prior reset tokens for user
    await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true });

    // Generate secure random short-lived token (15 mins)
    const { rawToken, hashedToken } = generateRandomToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash: hashedToken,
      expiresAt,
      used: false,
    });

    // Send email via Resend API
    await sendPasswordResetEmail(user.email, rawToken);

    return genericResponse;
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
