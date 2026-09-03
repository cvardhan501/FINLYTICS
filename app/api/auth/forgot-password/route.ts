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
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const { email } = result.data;
    const db = await connectToDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database connection error. Please try again later.' }, { status: 503 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'No account registered with this email address. Please check your email or create an account.' },
        { status: 404 }
      );
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
    const emailResult = await sendPasswordResetEmail(user.email, rawToken);

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.message || 'Failed to send password reset email' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Password reset link sent to your email successfully!',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error. Failed to process request.' }, { status: 500 });
  }
}
