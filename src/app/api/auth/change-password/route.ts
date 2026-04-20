import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { userId, sessionToken, currentPassword, newPassword } = await request.json();

    if (!userId || !sessionToken || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(userId).select('password sessionToken');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.sessionToken !== sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await User.findByIdAndUpdate(userId, { password: hashed });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
