import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICollection extends Document {
  userId: Types.ObjectId;
  cardId: Types.ObjectId;
  quantity: number;
  isCrystalized: boolean;
  acquiredAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 0,
    },
    isCrystalized: {
      type: Boolean,
      default: false,
    },
    acquiredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A user can only have one collection entry per card
CollectionSchema.index({ userId: 1, cardId: 1 }, { unique: true });

export const Collection =
  mongoose.models.Collection || mongoose.model<ICollection>('Collection', CollectionSchema);
export default Collection;
