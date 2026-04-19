import mongoose, { Schema, type Document } from "mongoose";

export type CardRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "superRare"
  | "epic"
  | "legendary";
// Generation code is flexible (H1, H2, H1a, …); stored as the Generation.code string
export type CardGeneration = string;

export const RARITY_ORDER: CardRarity[] = ["common", "uncommon", "rare", "superRare", "epic", "legendary"];

export interface ICard extends Document {
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation: CardGeneration;
  createdAt: Date;
  updatedAt: Date;
}

const CardSchema = new Schema<ICard>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    information: {
      type: String,
      required: true,
      trim: true,
    },
    rarity: {
      type: String,
      required: true,
      enum: ["common", "uncommon", "rare", "superRare", "epic", "legendary"],
      default: "common",
    },
    image: {
      type: String,
      default: "/white.png",
    },
    generation: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true },
);

// Cards with the same name can have different rarities
CardSchema.index({ name: 1, rarity: 1 }, { unique: true });

export const Card =
  mongoose.models.Card || mongoose.model<ICard>("Card", CardSchema);
export default Card;
