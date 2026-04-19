import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Card from '@/models/Card';

const GEN1 = 'gen1' as const;

const SEED_CARDS = [
  // === COMMON ===
  { name: '桜の精霊', information: '春の訪れとともに現れる、淡いピンクの花びらを纏った優しい精霊。', rarity: 'common', image: '/white.png', generation: GEN1 },
  { name: '星屑の子', information: '夜空から落ちてきた小さな星の欠片から生まれた、無邪気な存在。', rarity: 'common', image: '/white.png', generation: GEN1 },
  { name: '月の雫', information: '満月の夜に月光が凝縮されてできた、透き通るような美しい雫。', rarity: 'common', image: '/white.png', generation: GEN1 },
  { name: '風の妖精', information: '野原を駆け巡る気まぐれな妖精。笑い声は鈴の音に似ている。', rarity: 'common', image: '/white.png', generation: GEN1 },
  // === UNCOMMON ===
  { name: '桜の精霊', information: '満開の桜林を守護する力を持つ、より成長した桜の精霊。', rarity: 'uncommon', image: '/white.png', generation: GEN1 },
  { name: '氷晶の姫', information: '冬の朝に現れる、繊細な氷の結晶を操る小さなお姫様。', rarity: 'uncommon', image: '/white.png', generation: GEN1 },
  { name: '虹の使者', information: '雨上がりの空を渡る、七色の翼を持つ伝書鳥。', rarity: 'uncommon', image: '/white.png', generation: GEN1 },
  // === RARE ===
  { name: '桜の精霊', information: '古代の桜の木と魂が融合した守護者。花びらの嵐を召喚できる。', rarity: 'rare', image: '/white.png', generation: GEN1 },
  { name: '星屑の子', information: '宇宙の奥深くから届いた光の子。宙を自由に旅する能力を持つ。', rarity: 'rare', image: '/white.png', generation: GEN1 },
  { name: '深海の姫君', information: '誰も見たことのない深海に住む神秘的な姫。珊瑚と光を操る。', rarity: 'rare', image: '/white.png', generation: GEN1 },
  // === EPIC ===
  { name: '桜の精霊', information: '千年生きた霊桜と契約を交わした最強の精霊。空間を花でつなぐ。', rarity: 'epic', image: '/white.png', generation: GEN1 },
  { name: '雷光の龍', information: '嵐の中心で生まれた紫電を帯びた小さな龍。愛嬌があるが侮れない。', rarity: 'epic', image: '/white.png', generation: GEN1 },
  { name: '廃墟の女王', information: '滅びた王国の記憶を抱く悲しき女王。その涙は黒水晶に変わる。', rarity: 'epic', image: '/white.png', generation: GEN1 },
  { name: '氷晶の姫', information: '永久凍土を支配する氷の女王へと覚醒した、最強の冬の守護者。', rarity: 'epic', image: '/white.png', generation: GEN1 },
  // === LEGENDARY ===
  { name: '桜の精霊', information: '神代の力を解放した究極の桜の精霊。その姿は満開の桜そのもの。', rarity: 'legendary', image: '/white.png', generation: GEN1 },
  { name: '星屑の子', information: '銀河の意志を宿した究極の星の子。触れるものすべてを光に変える。', rarity: 'legendary', image: '/white.png', generation: GEN1 },
  { name: '虚空の王者', information: '存在と無の狭間に立つ者。宇宙の始まりと終わりを知っている。', rarity: 'legendary', image: '/white.png', generation: GEN1 },
  { name: '月の雫', information: '皆既月食の時にしか現れない、命を癒す究極の月の雫。', rarity: 'legendary', image: '/white.png', generation: GEN1 },
];

export async function POST() {
  try {
    await connectDB();

    const results = [];
    let created = 0;
    let skipped = 0;

    for (const cardData of SEED_CARDS) {
      try {
        await Card.create(cardData);
        results.push({ name: cardData.name, rarity: cardData.rarity, status: 'created' });
        created++;
      } catch (err: unknown) {
        // Duplicate key — already exists
        if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: number }).code === 11000) {
          results.push({ name: cardData.name, rarity: cardData.rarity, status: 'skipped' });
          skipped++;
        } else {
          throw err;
        }
      }
    }

    return NextResponse.json({ message: `Seed complete. Created: ${created}, Skipped: ${skipped}`, results });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
