import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Card from '@/models/Card';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rarity = searchParams.get('rarity');
    const search = searchParams.get('search');
    const generation = searchParams.get('generation');

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (rarity && rarity !== 'all') {
      filter.rarity = rarity;
    }
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (generation && generation !== 'all') {
      filter.generation = generation;
    }

    const cards = await Card.find(filter)
      .select('_id name rarity image generation information')
      .sort({ rarity: 1, name: 1 })
      .lean();

    return NextResponse.json(cards, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    });
  } catch (error) {
    console.error('Cards GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, information, rarity, image } = await request.json();

    if (!name || !information) {
      return NextResponse.json(
        { error: 'Name and information are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const card = await Card.create({
      name: name.trim(),
      information: information.trim(),
      rarity: rarity ?? 'common',
      image: image ?? '/white.png',
    });

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error('Cards POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
