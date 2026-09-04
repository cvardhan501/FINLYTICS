import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { Account } from '@/models/Account';
import { Category } from '@/models/Category';
import { hashPassword } from '@/lib/auth/passwords';
import { signJwtToken, getAuthCookieOptions } from '@/lib/auth/jwt';
import { registerSchema } from '@/schemas';

// In-memory mock fallback storage if MongoDB is not connected
const memoryUsers: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, currency } = result.data;
    const db = await connectToDatabase();

    let user: any;

    if (db) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        currency: currency || 'INR',
        lastLoginAt: new Date(),
      });
    } else {
      // Memory fallback
      const existing = memoryUsers.find((u) => u.email === email.toLowerCase());
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      const passwordHash = await hashPassword(password);
      user = {
        _id: 'mem_user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        passwordHash,
        currency: currency || 'INR',
        createdAt: new Date(),
      };
      memoryUsers.push(user);
    }

    const token = signJwtToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      currency: user.currency,
    });

    const response = NextResponse.json({
      message: 'Account registered successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        currency: user.currency,
      },
    });

    const cookieOpts = getAuthCookieOptions();
    response.cookies.set(cookieOpts.name, token, cookieOpts);

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
