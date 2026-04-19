import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import FriendRequest from '@/models/FriendRequest';
import Notification from '@/models/Notification';
import { logAction } from '@/lib/logAction';

/** GET /api/friends?userId=... — list accepted friends */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await connectDB();

  const user = await User.findById(userId).select('friends').populate({
    path: 'friends',
    select: 'displayName friendCode',
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user.friends ?? []);
}

/** POST /api/friends — send a friend request by friendCode */
export async function POST(request: Request) {
  try {
    const { userId, friendCode } = await request.json();

    if (!userId || !friendCode) {
      return NextResponse.json({ error: 'userId and friendCode are required' }, { status: 400 });
    }

    await connectDB();

    const target = await User.findOne({ friendCode: friendCode.trim() }).select('_id displayName friendCode');
    if (!target) {
      return NextResponse.json({ error: 'No user found with that friend code' }, { status: 404 });
    }

    if (String(target._id) === String(userId)) {
      return NextResponse.json({ error: "You can't add yourself" }, { status: 400 });
    }

    const me = await User.findById(userId).select('friends displayName');
    if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Already friends?
    if (me.friends.some((f: unknown) => String(f) === String(target._id))) {
      return NextResponse.json({ error: 'Already friends' }, { status: 409 });
    }

    // Already a pending request?
    const existing = await FriendRequest.findOne({ fromUserId: userId, toUserId: target._id, status: 'pending' });
    if (existing) {
      return NextResponse.json({ error: 'Friend request already sent' }, { status: 409 });
    }

    // Create the request
    const req = await FriendRequest.create({ fromUserId: userId, toUserId: target._id, status: 'pending' });

    // Notify the recipient
    await Notification.create({
      userId: target._id,
      type: 'friend_request',
      title: 'New friend request',
      message: `${me.displayName} sent you a friend request.`,
      data: { requestId: String(req._id), fromUserId: String(userId), fromDisplayName: me.displayName },
    });

    await logAction(userId, 'friend_request_sent', { toUserId: String(target._id) });

    return NextResponse.json({ message: 'Friend request sent', requestId: String(req._id) });
  } catch (error) {
    console.error('Friend request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** DELETE /api/friends — remove a friend */
export async function DELETE(request: Request) {
  try {
    const { userId, friendId } = await request.json();
    if (!userId || !friendId) {
      return NextResponse.json({ error: 'userId and friendId are required' }, { status: 400 });
    }
    await connectDB();
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    await logAction(userId, 'friend_removed', { friendId });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

