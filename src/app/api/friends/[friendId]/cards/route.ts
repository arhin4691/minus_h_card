import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Collection from '@/models/Collection';
import User from '@/models/User';

/** GET /api/friends/[friendId]/cards?userId=... — get a friend's collection */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ friendId: string }> },
) {
  const { friendId } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await connectDB();

  // Verify they are actually friends
  const me = await User.findById(userId).select('friends');
  if (!me) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const isFriend = me.friends.some((f: unknown) => String(f) === String(friendId));
  if (!isFriend) {
    return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 });
  }

  const collection = await Collection.find({ userId: friendId })
    .populate('cardId', 'name rarity image generation information')
    .sort({ acquiredAt: -1 })
    .lean();

  return NextResponse.json(collection);
}
