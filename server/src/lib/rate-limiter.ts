import { RateLimit } from '../models/rate-limit.model.js';

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

interface RateLimitState {
  hits: Date[];
  allowed: boolean;
  checkedAt: Date;
}

/**
 * Records an attempt for `key` in a sliding window and returns how long to wait if it is
 * over the limit (or null if allowed). The check and the write are one atomic update on one
 * document, timed by the database clock, so concurrent requests can't exceed the limit.
 * Blocked attempts aren't recorded.
 */
export async function consumeRateLimit(key: string, { limit, windowMs }: RateLimitRule) {
  const state = (await RateLimit.collection.findOneAndUpdate(
    { _id: key } as never,
    [
      // drop attempts that have left the window
      {
        $set: {
          hits: {
            $filter: {
              input: { $ifNull: ['$hits', []] },
              cond: { $gt: ['$$this', { $subtract: ['$$NOW', windowMs] }] },
            },
          },
        },
      },
      { $set: { allowed: { $lt: [{ $size: '$hits' }, limit] }, checkedAt: '$$NOW' } },
      // record this attempt only if it is allowed
      {
        $set: {
          hits: { $cond: ['$allowed', { $concatArrays: ['$hits', ['$$NOW']] }, '$hits'] },
          expiresAt: { $add: ['$$NOW', windowMs] },
        },
      },
    ],
    { upsert: true, returnDocument: 'after' },
  )) as RateLimitState | null;

  if (!state || state.allowed) return null;
  const msLeft = state.hits[0]!.getTime() + windowMs - state.checkedAt.getTime();
  return { retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)) };
}
