import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { generateFriendCode } from '@/models/User';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const userId = request.headers.get('X-User-Id');

  if (!authHeader || !userId) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ _id: userId, sessionToken: token }).select(
    'displayName minusEnergy friendCode giftsGiven badges',
  );

  if (!user) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Auto-assign friend code if missing
  if (!user.friendCode) {
    let code = generateFriendCode();
    while (await User.exists({ friendCode: code })) {
      code = generateFriendCode();
    }
    user.friendCode = code;
    await user.save();
  }

  return NextResponse.json({
    valid: true,
    displayName: user.displayName,
    minusEnergy: user.minusEnergy,
    friendCode: user.friendCode ?? null,
    giftsGiven: user.giftsGiven,
    badgesCount: user.badges.length,
  });
}
