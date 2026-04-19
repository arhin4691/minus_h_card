import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type AuditAction =
  | 'draw_card'
  | 'gift_card'
  | 'explore'
  | 'friend_request_sent'
  | 'friend_request_accepted'
  | 'friend_request_denied'
  | 'friend_removed';

export interface IAuditLog extends Document {
  userId: Types.ObjectId;
  action: AuditAction;
  details: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action:  { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ip:      { type: String, default: null },
  },
  { timestamps: true },
);

AuditLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
// Useful for rate-limit queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
