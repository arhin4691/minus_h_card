import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'card_received'
  | 'app_news'
  | 'system';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['friend_request', 'friend_accepted', 'card_received', 'app_news', 'system'], required: true },
    title:   { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 400 },
    data:    { type: Schema.Types.Mixed, default: {} },
    read:    { type: Boolean, default: false },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;
