import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Social from '@/models/Social';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const social = await Social.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }],
    })
      .populate('fromUserId', 'displayName email')
      .populate('toUserId', 'displayName email')
      .populate('cardId', 'name rarity image')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(social);
  } catch (error) {
    console.error('Social GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
