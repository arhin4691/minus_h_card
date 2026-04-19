import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type FriendRequestStatus = 'pending' | 'accepted' | 'denied';

export interface IFriendRequest extends Document {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  status: FriendRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:     { type: String, enum: ['pending', 'accepted', 'denied'], default: 'pending' },
  },
  { timestamps: true },
);

FriendRequestSchema.index({ toUserId: 1, status: 1 });
FriendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export const FriendRequest =
  mongoose.models.FriendRequest ||
  mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);
export default FriendRequest;
