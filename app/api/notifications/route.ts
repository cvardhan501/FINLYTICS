import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Notification } from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth/jwt';
import { processUserReminders } from '@/lib/services/reminderEngine';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const unreadOnly = searchParams.get('unread') === 'true';

    const db = await connectToDatabase();

    if (db) {
      await processUserReminders(authUser.userId);

      const query: any = { userId: authUser.userId };
      if (category && category !== 'all') {
        query.category = category;
      }
      if (unreadOnly) {
        query.isRead = false;
      }

      const list = await Notification.find(query).sort({ createdAt: -1 }).lean();
      const unreadCount = await Notification.countDocuments({ userId: authUser.userId, isRead: false });

      return NextResponse.json({
        notifications: list.map((n: any) => ({ ...n, id: n._id.toString() })),
        unreadCount,
      });
    }

    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      await Notification.updateMany(
        { userId: authUser.userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    }

    return NextResponse.json({ message: 'All notifications marked as read', unreadCount: 0 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const result = await Notification.deleteMany({ userId: authUser.userId });
      return NextResponse.json({
        message: 'All notifications cleared successfully',
        clearedCount: result.deletedCount,
        unreadCount: 0,
      });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}
