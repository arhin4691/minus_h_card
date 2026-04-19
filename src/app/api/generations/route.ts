import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generation from '@/models/Generation';

export async function GET() {
  try {
    await connectDB();
    const generations = await Generation.find({ isActive: true })
      .sort({ releaseDate: 1 })
      .lean();
    return NextResponse.json(generations, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('Generations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { code, nameEn, nameJa, description, releaseDate } = await request.json();

    if (!code || !nameEn || !nameJa || !releaseDate) {
      return NextResponse.json(
        { error: 'code, nameEn, nameJa, and releaseDate are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const gen = await Generation.findOneAndUpdate(
      { code: code.toUpperCase() },
      { code: code.toUpperCase(), nameEn, nameJa, description: description ?? '', releaseDate: new Date(releaseDate), isActive: true },
      { upsert: true, new: true }
    );

    return NextResponse.json(gen, { status: 201 });
  } catch (error) {
    console.error('Generations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
