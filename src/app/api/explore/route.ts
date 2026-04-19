import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const MAX_DAILY_ATTEMPTS = 2;
const MIN_ENERGY = 5;
const MAX_ENERGY = 25;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(userId).select('exploreDate exploreAttempts minusEnergy');
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = user.exploreDate !== today;
  const attemptsLeft = isNewDay ? MAX_DAILY_ATTEMPTS : MAX_DAILY_ATTEMPTS - user.exploreAttempts;

  return NextResponse.json({ attemptsLeft: Math.max(0, attemptsLeft), totalEnergy: user.minusEnergy });
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const isNewDay = user.exploreDate !== today;

    // Reset attempts if it's a new day
    const currentAttempts = isNewDay ? 0 : user.exploreAttempts;

    if (currentAttempts >= MAX_DAILY_ATTEMPTS) {
      return NextResponse.json(
        { error: 'No attempts left today', attemptsLeft: 0 },
        { status: 429 }
      );
    }

    // Generate random energy
    const energyFound =
      Math.floor(Math.random() * (MAX_ENERGY - MIN_ENERGY + 1)) + MIN_ENERGY;

    // Update user with proper schema fields
    await User.findByIdAndUpdate(userId, {
      $inc: { minusEnergy: energyFound },
      $set: {
        exploreDate: today,
        exploreAttempts: currentAttempts + 1,
      },
    });

    return NextResponse.json({
      energyFound,
      attemptsLeft: MAX_DAILY_ATTEMPTS - (currentAttempts + 1),
      totalEnergy: user.minusEnergy + energyFound,
    });
  } catch (error) {
    console.error('Explore error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
