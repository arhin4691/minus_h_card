import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { generateFriendCode } from '@/models/User';
import { hashPassword, generateSessionToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, displayName } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);
    const sessionToken = generateSessionToken();

    // Generate a unique friend code (retry on collision — astronomically rare)
    let friendCode = generateFriendCode();
    while (await User.exists({ friendCode })) {
      friendCode = generateFriendCode();
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName.trim(),
      sessionToken,
      friendCode,
    });

    return NextResponse.json(
      {
        userId: user._id,
        email: user.email,
        displayName: user.displayName,
        sessionToken: user.sessionToken,
        minusEnergy: user.minusEnergy,
        friendCode: user.friendCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


