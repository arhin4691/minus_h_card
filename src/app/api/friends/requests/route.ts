import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FriendRequest from '@/models/FriendRequest';

/**
 * GET /api/friends/requests?userId=...
 * Returns all PENDING incoming friend requests for the given user,
 * with the requester's displayName and friendCode populated.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await connectDB();

  const requests = await FriendRequest.find({ toUserId: userId, status: 'pending' })
    .sort({ createdAt: -1 })
    .populate({ path: 'fromUserId', select: 'displayName friendCode' })
    .lean();

  return NextResponse.json(requests);
}
