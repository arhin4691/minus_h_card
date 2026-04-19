import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type SocialActionType = 'gift' | 'bless';

export interface ISocial extends Document {
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  cardId: Types.ObjectId;
  actionType: SocialActionType;
  message?: string;
  createdAt: Date;
}

const SocialSchema = new Schema<ISocial>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'Card',
      required: true,
    },
    actionType: {
      type: String,
      required: true,
      enum: ['gift', 'bless'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { timestamps: true }
);

SocialSchema.index({ fromUserId: 1, createdAt: -1 });
SocialSchema.index({ toUserId: 1, createdAt: -1 });

export const Social = mongoose.models.Social || mongoose.model<ISocial>('Social', SocialSchema);
export default Social;
