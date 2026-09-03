import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const user = await User.findById(authUser.userId).select('-passwordHash');
      if (user) {
        return NextResponse.json({ user });
      }
    }

    return NextResponse.json({
      user: {
        id: authUser.userId,
        name: authUser.name,
        email: authUser.email,
        currency: authUser.currency || 'INR',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
