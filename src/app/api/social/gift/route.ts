import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Social from '@/models/Social';
import Collection from '@/models/Collection';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    const { fromUserId, toFriendId, cardId } = await request.json();

    if (!fromUserId || !toFriendId || !cardId) {
      return NextResponse.json(
        { error: 'fromUserId, toFriendId, and cardId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (toFriendId === fromUserId) {
      return NextResponse.json({ error: 'Cannot gift to yourself' }, { status: 400 });
    }

    // Verify friendship — sender must have recipient in their friends list
    const sender = await User.findById(fromUserId).select('friends giftsGiven badges');
    if (!sender) {
      return NextResponse.json({ error: 'Sender not found' }, { status: 404 });
    }

    const isFriend = sender.friends.some(
      (id: { toString: () => string }) => id.toString() === toFriendId
    );
    if (!isFriend) {
      return NextResponse.json(
        { error: 'You can only gift to friends. Add them first using a friend code.' },
        { status: 403 }
      );
    }

    const recipient = await User.findById(toFriendId);
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Check sender has duplicate (quantity > 1)
    const senderCollection = await Collection.findOne({
      userId: fromUserId,
      cardId,
    });

    if (!senderCollection || senderCollection.quantity < 2) {
      return NextResponse.json(
        { error: 'You need at least 2 copies to gift' },
        { status: 400 }
      );
    }

    // Decrease sender quantity
    senderCollection.quantity -= 1;
    await senderCollection.save();

    // Add to recipient collection (upsert)
    await Collection.findOneAndUpdate(
      { userId: recipient._id, cardId },
      { $inc: { quantity: 1 }, $setOnInsert: { acquiredAt: new Date() } },
      { upsert: true }
    );

    // Record social action
    await Social.create({
      fromUserId,
      toUserId: recipient._id,
      cardId,
      actionType: 'gift',
    });

    // Increment sender’s gifts given
    await User.findByIdAndUpdate(fromUserId, { $inc: { giftsGiven: 1 } });

    // Refresh sender for badge check
    const updatedSender = await User.findById(fromUserId);
    if (updatedSender) {
      const giftCount = updatedSender.giftsGiven;
      const badges: string[] = [];
      if (giftCount >= 1 && !updatedSender.badges.includes('first_gift'))
        badges.push('first_gift');
      if (giftCount >= 10 && !updatedSender.badges.includes('generous_soul'))
        badges.push('generous_soul');
      if (giftCount >= 50 && !updatedSender.badges.includes('gift_master'))
        badges.push('gift_master');

      if (badges.length > 0) {
        await User.findByIdAndUpdate(fromUserId, {
          $addToSet: { badges: { $each: badges } },
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Gift error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
