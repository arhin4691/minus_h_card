import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Card from '@/models/Card';
import Collection from '@/models/Collection';
import type { CardRarity } from '@/models/Card';
import { logAction, countRecentActions } from '@/lib/logAction';

const DRAW_COST = 10;
/** Max draws (individual cards) per minute per user — anti-cheat rate limit */
const MAX_DRAWS_PER_MINUTE = 30;

// Weighted rarity pool (sum = 100) — 'legendary' only via milestone
const RARITY_WEIGHTS: { rarity: CardRarity; weight: number }[] = [
  { rarity: 'common',    weight: 40 },
  { rarity: 'uncommon',  weight: 25 },
  { rarity: 'rare',      weight: 20 },
  { rarity: 'superRare', weight: 10 },
  { rarity: 'epic',      weight: 5 },
  { rarity: 'legendary', weight: 1 },
];

function pickRarity(): CardRarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const { rarity, weight } of RARITY_WEIGHTS) {
    cumulative += weight;
    if (roll < cumulative) return rarity;
  }
  return 'common';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, generation, count: rawCount, sessionToken } = body;
    const count = Math.min(Math.max(Number(rawCount) || 1, 1), 10);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Session token validation — reject if token doesn't match
    if (!sessionToken || user.sessionToken !== sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting: max MAX_DRAWS_PER_MINUTE individual card draws per 60 seconds
    const recentDraws = await countRecentActions(userId, 'draw_card', 60_000);
    if (recentDraws + count > MAX_DRAWS_PER_MINUTE) {
      return NextResponse.json(
        { error: 'Too many draws. Please wait a moment before drawing again.' },
        { status: 429 },
      );
    }

    const totalCost = DRAW_COST * count;
    if (user.minusEnergy < totalCost) {
      return NextResponse.json(
        { error: 'Not enough energy', required: totalCost, current: user.minusEnergy },
        { status: 400 }
      );
    }

    const genFilter = generation && generation !== 'all' ? { generation } : {};
    const cardFields = '_id name rarity image generation information';
    const allCards = await Card.find(genFilter).select(cardFields).lean();
    const fallback = allCards.length > 0 ? allCards : await Card.find().select(cardFields).lean();

    if (fallback.length === 0) {
      return NextResponse.json({ error: 'No cards available to draw' }, { status: 404 });
    }

    // Draw `count` cards
    const drawnCards = Array.from({ length: count }, () => {
      const targetRarity = pickRarity();
      const pool = fallback.filter((c) => c.rarity === targetRarity);
      const candidates = pool.length > 0 ? pool : fallback;
      return candidates[Math.floor(Math.random() * candidates.length)];
    });

    // Deduct energy
    await User.findByIdAndUpdate(userId, { $inc: { minusEnergy: -totalCost } });

    // Upsert all cards into collection
    await Promise.all(
      drawnCards.map((card) =>
        Collection.findOneAndUpdate(
          { userId, cardId: card._id },
          { $inc: { quantity: 1 }, $setOnInsert: { acquiredAt: new Date() } },
          { upsert: true }
        )
      )
    );

    // Audit log — one entry per individual drawn card
    const ip = request.headers.get('x-forwarded-for') ?? undefined;
    await Promise.all(
      drawnCards.map((card) =>
        logAction(userId, 'draw_card', { cardId: String(card._id), rarity: card.rarity, generation: card.generation ?? null, energySpent: DRAW_COST }, ip)
      )
    );

    if (count === 1) {
      return NextResponse.json({
        card: drawnCards[0],
        cards: drawnCards,
        energySpent: totalCost,
        remainingEnergy: user.minusEnergy - totalCost,
      });
    }

    return NextResponse.json({
      cards: drawnCards,
      energySpent: totalCost,
      remainingEnergy: user.minusEnergy - totalCost,
    });
  } catch (error) {
    console.error('Draw error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
