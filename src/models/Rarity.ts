import mongoose, { Schema, type Document } from 'mongoose';

export type RarityCode = 'C' | 'UC' | 'R' | 'SR' | 'SSR' | 'L';

export interface IRarity extends Document {
  code: RarityCode;
  nameEn: string;
  nameJa: string;
  nameZhHK: string;
  order: number;
}

const RaritySchema = new Schema<IRarity>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      enum: ['C', 'UC', 'R', 'SR', 'SSR', 'L'],
    },
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },
    nameJa: {
      type: String,
      required: true,
      trim: true,
    },
    nameZhHK: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
  },
  { timestamps: true }
);

export const Rarity =
  mongoose.models.Rarity ||
  mongoose.model<IRarity>('Rarity', RaritySchema);
export default Rarity;
