import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';

/** GET /api/notifications?userId=...&limit=30 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const limit = Math.min(Number(searchParams.get('limit') ?? 30), 100);

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await connectDB();

  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const unreadCount = await Notification.countDocuments({ userId, read: false });

  return NextResponse.json({ notifications, unreadCount });
}

/** DELETE /api/notifications — delete a single notification */
export async function DELETE(request: Request) {
  try {
    const { userId, notificationId } = await request.json() as { userId: string; notificationId: string };

    if (!userId || !notificationId) {
      return NextResponse.json({ error: 'userId and notificationId are required' }, { status: 400 });
    }

    await connectDB();
    await Notification.findOneAndDelete({ _id: notificationId, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

