import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'FINLYTICS <onboarding@resend.dev>';

export function getAppUrl(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  return 'http://localhost:3000';
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<{ success: boolean; message: string }> {
  const baseUrl = getAppUrl();
  const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

  if (!resend) {
    console.log(`[EMAIL SIMULATION] Password reset requested for ${toEmail}. Link: ${resetUrl}`);
    return {
      success: true,
      message: 'Password reset link generated (RESEND_API_KEY not set).',
    };
  }

  try {
    const data = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: [toEmail],
      subject: 'Reset Your Password — FINLYTICS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #187A4E; margin: 0; font-size: 22px; font-weight: 800; tracking-tight: -0.5px;">FINLYTICS</h2>
            <p style="color: #187A4E; font-size: 11px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Track • Plan • Save • Grow</p>
          </div>

          <h3 style="color: #111827; font-size: 18px; margin-bottom: 12px;">Password Reset Request</h3>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset the password for your FINLYTICS account. Click the secure button below to create your new password. This link is valid for 15 minutes.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #187A4E; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 700; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Reset Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
            If you did not request a password reset, you can safely ignore this email. Your account remains secure.
          </p>

          <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />

          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
            FINLYTICS — Secure Personal Finance Management
          </p>
        </div>
      `,
    });

    console.log('[FINLYTICS EMAIL] Resend password reset email sent:', data);
    return { success: true, message: 'Password reset link sent to your email.' };
  } catch (error: any) {
    console.error('[FINLYTICS EMAIL] Error sending password reset email via Resend:', error);
    return { success: false, message: 'Failed to send password reset email.' };
  }
}
