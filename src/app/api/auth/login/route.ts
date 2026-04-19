import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { generateFriendCode } from '@/models/User';
import { verifyPassword, generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Generate new session token
    user.sessionToken = generateSessionToken();

    // Backfill friend code for legacy accounts that don't have one
    if (!user.friendCode) {
      let code = generateFriendCode();
      while (await User.exists({ friendCode: code })) {
        code = generateFriendCode();
      }
      user.friendCode = code;
    }

    await user.save();

    return NextResponse.json({
      userId: user._id,
      email: user.email,
      displayName: user.displayName,
      sessionToken: user.sessionToken,
      minusEnergy: user.minusEnergy,
      friendCode: user.friendCode,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


