import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connect';
import { Notification } from '@/models/Notification';
import { getAuthenticatedUser } from '@/lib/auth/jwt';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const notif = await Notification.findOne({ _id: id, userId: authUser.userId });
      if (!notif) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      await Notification.deleteOne({ _id: id, userId: authUser.userId });
      const unreadCount = await Notification.countDocuments({ userId: authUser.userId, isRead: false });

      return NextResponse.json({ message: 'Notification deleted successfully', unreadCount });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectToDatabase();
    if (db) {
      const notif = await Notification.findOne({ _id: id, userId: authUser.userId });
      if (!notif) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }

      notif.isRead = true;
      notif.readAt = new Date();
      await notif.save();

      const unreadCount = await Notification.countDocuments({ userId: authUser.userId, isRead: false });

      return NextResponse.json({ message: 'Notification marked as read', notif, unreadCount });
    }

    return NextResponse.json({ error: 'Database connection offline' }, { status: 503 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to mark notification read' }, { status: 500 });
  }
}
