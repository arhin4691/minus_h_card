/**
 * Direct MongoDB seed script — run with: node scripts/seed-generations.mjs
 *
 * Creates the Generation collection (H1, H1A, H2, H2A) and assigns
 * generation codes to all existing card documents that are missing one.
 */

import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://minus_h_card:Minushcard2026@cluster0.oiin72f.mongodb.net/minus_h_card?retryWrites=true&w=majority';

const GENERATIONS = [
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
];

async function main() {
  const client = new MongoClient(URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas');

    const db = client.db('minus_h_card');

    // ── 1. Upsert Generation documents ──────────────────────────────────────
    const genCol = db.collection('generations');
    console.log('\n── Seeding generations ──');
    for (const gen of GENERATIONS) {
      const result = await genCol.updateOne(
        { code: gen.code },
        { $set: { ...gen, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      const status = result.upsertedCount > 0 ? 'created' : 'updated';
      console.log(`  ${status}: ${gen.code} — ${gen.nameEn}`);
    }

    // ── 2. Show current generation distribution in cards ───────────────────
    const cardCol = db.collection('cards');
    const totalCards = await cardCol.countDocuments();
    console.log(`\n── Cards: ${totalCards} total ──`);

    const genStats = await cardCol.aggregate([
      { $group: { _id: '$generation', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray();
    console.log('  Generation distribution before update:');
    for (const s of genStats) {
      console.log(`    ${s._id ?? '(none)'}: ${s.count}`);
    }

    // ── 3. Assign H1 to cards missing a generation ─────────────────────────
    const assignResult = await cardCol.updateMany(
      { $or: [{ generation: null }, { generation: { $exists: false } }, { generation: '' }] },
      { $set: { generation: 'H1' } }
    );
    console.log(`\n  Assigned H1 to ${assignResult.modifiedCount} card(s) that had no generation.`);

    // ── 4. Final snapshot ──────────────────────────────────────────────────
    const finalStats = await cardCol.aggregate([
      { $group: { _id: '$generation', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray();
    console.log('\n  Generation distribution after update:');
    for (const s of finalStats) {
      console.log(`    ${s._id ?? '(none)'}: ${s.count}`);
    }

    console.log('\n✓ Done!');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
