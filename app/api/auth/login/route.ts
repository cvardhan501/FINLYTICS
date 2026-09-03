import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { comparePassword } from '@/lib/auth/passwords';
import { signJwtToken, getAuthCookieOptions } from '@/lib/auth/jwt';
import { loginSchema } from '@/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();
    const db = await connectToDatabase();

    let user: any;

    if (db) {
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isMatch = await comparePassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Demo fallback mode only if demo email explicitly requested
      if (normalizedEmail === 'demo@expensetracker.com') {
        user = {
          _id: 'demo_user_123',
          name: 'Demo User',
          email: 'demo@expensetracker.com',
          currency: 'INR',
        };
      } else {
        return NextResponse.json({ error: 'Database connection offline. Please check MONGODB_URI.' }, { status: 503 });
      }
    }

    const token = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      currency: user.currency || 'INR',
    });

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency || 'INR',
      },
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
