import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Generation from '@/models/Generation';
import Card from '@/models/Card';
import mongoose from 'mongoose';

const GENERATION_SEED = [
  {
    code: 'H1',
    nameJa: '第一弾',
    nameEn: 'Generation 1 — Origin',
    description: 'The debut collection introducing the core Minus H universe. Classic designs, iconic characters.',
    releaseDate: new Date('2024-01-01'),
    isActive: true,
  },
  {
    code: 'H1A',
    nameJa: '第一弾A',
    nameEn: 'Generation 1A — Supplement',
    description: 'An extended supplementary release adding rare variants and alternate art to the first generation.',
    releaseDate: new Date('2024-07-01'),
    isActive: true,
  },
  {
    code: 'H2',
    nameJa: '第二弾',
    nameEn: 'Generation 2 — Bloom',
    description: 'A vibrant new season celebrating colour, growth, and new characters joining the Minus H world.',
    releaseDate: new Date('2025-01-01'),
    isActive: true,
  },
  {
    code: 'H2A',
    nameJa: '第二弾A',
    nameEn: 'Generation 2A — Special Edition',
    description: 'Limited special edition cards exclusive to events and collaborations during the Bloom season.',
    releaseDate: new Date('2025-06-01'),
    isActive: true,
  },
] as const;

export async function POST() {
  try {
    await connectDB();

    // 1. Seed / upsert Generation collection
    const generationResults: string[] = [];
    for (const gen of GENERATION_SEED) {
      await Generation.findOneAndUpdate(
        { code: gen.code },
        {
          code: gen.code,
          nameJa: gen.nameJa,
          nameEn: gen.nameEn,
          description: gen.description,
          releaseDate: gen.releaseDate,
          isActive: gen.isActive,
        },
        { upsert: true, new: true }
      );
      generationResults.push(gen.code);
    }

    // 2. Assign H1 as default generation to any cards missing one
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json({ error: 'No DB connection' }, { status: 500 });
    }
    const cardCollection = db.collection('cards');

    const assignResult = await cardCollection.updateMany(
      { $or: [{ generation: null }, { generation: { $exists: false } }, { generation: '' }] },
      { $set: { generation: 'H1' } }
    );

    // 3. Snapshot: show how many cards exist per generation
    const stats = await cardCollection
      .aggregate([{ $group: { _id: '$generation', count: { $sum: 1 } } }, { $sort: { _id: 1 } }])
      .toArray();

    return NextResponse.json({
      success: true,
      seeded: { generations: generationResults },
      assigned: { cardsGivenH1: assignResult.modifiedCount },
      generationStats: stats,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed', detail: String(error) }, { status: 500 });
  }
}

