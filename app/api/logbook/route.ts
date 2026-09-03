import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { LogBookEntry } from '@/models/LogBookEntry';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { logBookEntrySchema } from '@/schemas';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const db = await connectToDatabase();

    if (db) {
      const query: any = { userId: authUser.userId };
      if (category && category !== 'all') query.category = category;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ];
      }

      const logs = await LogBookEntry.find(query).sort({ date: -1 }).lean();
      return NextResponse.json({ logs: logs.map((l: any) => ({ ...l, id: l._id.toString() })) });
    }

    return NextResponse.json({ logs: [] });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch log book entries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = logBookEntrySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 });
    }

    const data = result.data;
    const db = await connectToDatabase();

    if (db) {
      const newLog = await LogBookEntry.create({
        userId: authUser.userId,
        ...data,
        date: new Date(data.date),
      });
      return NextResponse.json({ message: 'Log saved successfully', log: newLog });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save log entry' }, { status: 500 });
  }
}
