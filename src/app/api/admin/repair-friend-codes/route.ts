import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { generateFriendCode } from '@/models/User';

/**
 * POST /api/admin/repair-friend-codes
 * Assigns a unique friend code to every user that is missing one.
 */
export async function POST() {
  await connectDB();

  const usersWithoutCode = await User.find({
    $or: [{ friendCode: null }, { friendCode: { $exists: false } }],
  }).select('_id');

  let repaired = 0;

  for (const user of usersWithoutCode) {
    let code = generateFriendCode();
    // eslint-disable-next-line no-await-in-loop
    while (await User.exists({ friendCode: code })) {
      code = generateFriendCode();
    }
    // eslint-disable-next-line no-await-in-loop
    await User.updateOne({ _id: user._id }, { $set: { friendCode: code } });
    repaired++;
  }

  return NextResponse.json({ repaired });
}
