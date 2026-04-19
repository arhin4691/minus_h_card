import connectDB from '@/lib/mongodb';
import AuditLog, { type AuditAction } from '@/models/AuditLog';
import type mongoose from 'mongoose';

/**
 * Write an audit entry to the database.
 * Fire-and-forget from API routes — errors are swallowed to avoid breaking the main flow.
 */
export async function logAction(
  userId: string | mongoose.Types.ObjectId,
  action: AuditAction,
  details: Record<string, unknown> = {},
  ip?: string,
): Promise<void> {
  try {
    await connectDB();
    await AuditLog.create({ userId, action, details, ip: ip ?? null });
  } catch (err) {
    // Non-fatal — never let logging break the main request
    console.error('[audit] Failed to log action:', action, err);
  }
}

/**
 * Count how many times `userId` performed `action` within the last `windowMs` milliseconds.
 * Used for rate limiting (no Redis required).
 */
export async function countRecentActions(
  userId: string | mongoose.Types.ObjectId,
  action: AuditAction,
  windowMs: number,
): Promise<number> {
  await connectDB();
  const since = new Date(Date.now() - windowMs);
  return AuditLog.countDocuments({ userId, action, createdAt: { $gte: since } });
}
