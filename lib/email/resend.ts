import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Expense Tracker <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<{ success: boolean; message: string }> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

  if (!resend) {
    console.log(`[EMAIL SIMULATION] Password reset requested for ${toEmail}. Link: ${resetUrl}`);
    return {
      success: true,
      message: 'Password reset link simulated in server console (RESEND_API_KEY not set).',
    };
  }

  try {
    const data = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [toEmail],
      subject: 'Reset Your Password — Expense Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #187A4E; margin: 0;">Expense Tracker</h2>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Track • Plan • Save • Grow</p>
          </div>
          <h3 style="color: #111827;">Password Reset Request</h3>
          <p style="color: #374151; font-size: 15px; line-height: 1.5;">
            We received a request to reset the password for your Expense Tracker account. Click the button below to reset your password. This link is valid for 15 minutes.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #187A4E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Expense Tracker — Secure Personal Finance Management
          </p>
        </div>
      `,
    });

    console.log('Resend email result:', data);
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error: any) {
    console.error('Error sending password reset email via Resend:', error);
    return { success: false, message: 'Failed to send password reset email.' };
  }
}
