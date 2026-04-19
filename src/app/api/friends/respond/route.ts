import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import FriendRequest from '@/models/FriendRequest';
import Notification from '@/models/Notification';
import { logAction } from '@/lib/logAction';

/**
 * POST /api/friends/respond
 * Body: { requestId, userId, action: 'accept' | 'deny' }
 * `userId` must be the toUserId (the recipient of the request).
 */
export async function POST(request: Request) {
  try {
    const { requestId, userId, action } = await request.json() as {
      requestId: string;
      userId: string;
      action: 'accept' | 'deny';
    };

    if (!requestId || !userId || !['accept', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'requestId, userId and action (accept|deny) are required' }, { status: 400 });
    }

    await connectDB();

    const friendReq = await FriendRequest.findById(requestId);
    if (!friendReq) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    if (String(friendReq.toUserId) !== String(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (friendReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request already resolved' }, { status: 409 });
    }

    if (action === 'accept') {
      friendReq.status = 'accepted';
      await friendReq.save();

      // Add mutual friendship
      await User.findByIdAndUpdate(friendReq.fromUserId, { $addToSet: { friends: friendReq.toUserId } });
      await User.findByIdAndUpdate(friendReq.toUserId, { $addToSet: { friends: friendReq.fromUserId } });

      // Fetch acceptor's displayName for the notification
      const acceptor = await User.findById(userId).select('displayName');

      // Notify the original sender that their request was accepted
      await Notification.create({
        userId: friendReq.fromUserId,
        type: 'friend_accepted',
        title: 'Friend request accepted',
        message: `${acceptor?.displayName ?? 'Someone'} accepted your friend request.`,
        data: { fromUserId: String(friendReq.toUserId) },
      });

      await logAction(userId, 'friend_request_accepted', { requestId, fromUserId: String(friendReq.fromUserId) });

      return NextResponse.json({ success: true, action: 'accepted' });
    } else {
      friendReq.status = 'denied';
      await friendReq.save();
      await logAction(userId, 'friend_request_denied', { requestId, fromUserId: String(friendReq.fromUserId) });
      return NextResponse.json({ success: true, action: 'denied' });
    }
  } catch (error) {
    console.error('Friend respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
