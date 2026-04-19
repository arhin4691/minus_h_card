import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Collection from '@/models/Collection';
import Card from '@/models/Card';
import { RARITY_ORDER } from '@/models/Card';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    await connectDB();

    const collection = await Collection.find({ userId })
      .populate('cardId', 'name rarity image generation information')
      .sort({ acquiredAt: -1 })
      .lean();

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Collection GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, cardId } = await request.json();

    if (!userId || !cardId) {
      return NextResponse.json(
        { error: 'userId and cardId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert — increment quantity if already owned
    const collection = await Collection.findOneAndUpdate(
      { userId, cardId },
      { $inc: { quantity: 1 }, $setOnInsert: { acquiredAt: new Date() } },
      { upsert: true, new: true }
    ).populate('cardId');

    // Check for crystalized milestone:
    // If user owns all draweable rarities (C/UC/R/SR/SSR) of the same card name, unlock L (Legendary)
    const card = await Card.findById(cardId);
    if (card) {
      const allRarities = RARITY_ORDER.filter((r) => r !== 'legendary');
      const sameNameCards = await Card.find({ name: card.name }).lean();
      const sameNameCardIds = sameNameCards.map((c) => c._id);
      const ownedOfSameName = await Collection.find({
        userId,
        cardId: { $in: sameNameCardIds },
      })
        .populate('cardId')
        .lean();

      const ownedRarities = ownedOfSameName
        .map((c) => {
          const populatedCard = c.cardId as unknown as { rarity: string };
          return populatedCard.rarity;
        });

      const hasAllRarities = allRarities.every((r) => ownedRarities.includes(r));

      if (hasAllRarities) {
        // Mark all entries for this card name as crystalized
        await Collection.updateMany(
          { userId, cardId: { $in: sameNameCardIds } },
          { $set: { isCrystalized: true } }
        );
      }
    }

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error('Collection POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
