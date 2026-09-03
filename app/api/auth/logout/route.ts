import { NextResponse } from 'next/server';
import { getAuthCookieOptions } from '@/lib/auth/jwt';

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' });
  const cookieOpts = getAuthCookieOptions();
  response.cookies.set(cookieOpts.name, '', { ...cookieOpts, maxAge: 0 });
  return response;
}
