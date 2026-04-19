/**
 * Distribute cards across generations for a realistic demo.
 * Assigns:
 *   first 10 cards → H1
 *   next 5 cards   → H2
 *   last 3 cards   → H1A
 *
 * Run with: node scripts/distribute-generations.mjs
 */

import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://minus_h_card:Minushcard2026@cluster0.oiin72f.mongodb.net/minus_h_card?retryWrites=true&w=majority';

async function main() {
  const client = new MongoClient(URI);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB Atlas');

    const db = client.db('minus_h_card');
    const cardCol = db.collection('cards');

    // Fetch all cards sorted by _id (insertion order)
    const allCards = await cardCol.find({}).sort({ _id: 1 }).toArray();
    console.log(`Found ${allCards.length} cards`);

    if (allCards.length === 0) {
      console.log('No cards found, nothing to do.');
      return;
    }

    // Assign generations in batches
    const distribution = [
      { gen: 'H1',  count: 10 },
      { gen: 'H2',  count: 5 },
      { gen: 'H1A', count: Math.max(0, allCards.length - 15) },
    ];

    let offset = 0;
    for (const { gen, count } of distribution) {
      const slice = allCards.slice(offset, offset + count);
      if (slice.length === 0) break;
      const ids = slice.map((c) => c._id);
      await cardCol.updateMany({ _id: { $in: ids } }, { $set: { generation: gen } });
      console.log(`  → Assigned ${gen} to ${slice.length} card(s)`);
      offset += count;
    }

    // Final snapshot
    const stats = await cardCol.aggregate([
      { $group: { _id: '$generation', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]).toArray();
    console.log('\nFinal generation distribution:');
    for (const s of stats) {
      console.log(`  ${s._id}: ${s.count}`);
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
