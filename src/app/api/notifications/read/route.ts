import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/**
 * POST /api/notifications/read
 * Body: { userId, notificationId? }
 * - With notificationId  → mark that single notification as read
 * - Without notificationId → mark ALL notifications for userId as read
 */
export async function POST(request: Request) {
  try {
    const { userId, notificationId } = await request.json() as {
      userId: string;
      notificationId?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true },
      );
    } else {
      await Notification.updateMany({ userId, read: false }, { read: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
