import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { User } from '@/models/User';
import { processUserReminders } from '@/lib/services/reminderEngine';

const CRON_SECRET = process.env.CRON_SECRET || 'finlytics_cron_secret_key_2026';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const keyParam = searchParams.get('key');

    // Secure authentication check for scheduled Vercel cron runner
    const isAuthorized =
      (authHeader && authHeader === `Bearer ${CRON_SECRET}`) || keyParam === CRON_SECRET;

    if (!isAuthorized && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (!db) {
      return NextResponse.json({ message: 'Cron processed (mock mode).' });
    }

    const users = await User.find({}).select('_id name email notificationSettings');
    const results = [];

    for (const u of users) {
      const summary = await processUserReminders(u._id.toString());
      results.push(summary);
    }

    return NextResponse.json({
      message: 'Scheduled reminder engine completed successfully',
      processedUsersCount: users.length,
      results,
    });
  } catch (error: any) {
    console.error('Cron reminder engine error:', error);
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}
