import mongoose, { Schema, type Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  sessionToken?: string;
  minusEnergy: number;
  giftsGiven: number;
  badges: string[];
  exploreDate: string | null;
  exploreAttempts: number;
  friendCode: string;
  friends: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

/** Generate a unique-enough 12-digit friend code in XXXX-XXXX-XXXX format */
export function generateFriendCode(): string {
  const g = () => Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${g()}-${g()}-${g()}`;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    displayName: { type: String, required: true, trim: true, maxlength: 30 },
    sessionToken: { type: String, default: null },
    minusEnergy: { type: Number, default: 0 },
    giftsGiven: { type: Number, default: 0 },
    badges: { type: [String], default: [] },
    exploreDate: { type: String, default: null },
    exploreAttempts: { type: Number, default: 0 },
    friendCode: { type: String, unique: true, sparse: true },
    friends: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
