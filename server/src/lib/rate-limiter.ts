import { RateLimit } from '../models/rate-limit.model.js';
import { isDuplicateKeyError } from './mongo-errors.js';

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

interface RateLimitState {
  hits: Date[];
  allowed: boolean;
  checkedAt: Date;
}

/**
 * Records one attempt for `key` using a sliding window, and says whether it is allowed.
 *
 * The whole check-and-record runs as one atomic update on a single document, using
 * the database clock ($$NOW). So a burst of simultaneous requests, even across several
 * server instances, can never let more than `limit` attempts through.
 * Blocked attempts are not recorded, so a blocked client isn't locked out longer than the window.
 */
export async function consumeRateLimit(
  key: string,
  { limit, windowMs }: RateLimitRule,
): Promise<RateLimitResult> {
  const windowStart = { $subtract: ['$$NOW', windowMs] };
  const pipeline = [
    {
      $set: {
        hits: {
          $filter: {
            input: { $ifNull: ['$hits', []] },
            as: 'h',
            cond: { $gt: ['$$h', windowStart] },
          },
        },
      },
    },
    { $set: { allowed: { $lt: [{ $size: '$hits' }, limit] }, checkedAt: '$$NOW' } },
    {
      $set: {
        hits: { $cond: ['$allowed', { $concatArrays: ['$hits', ['$$NOW']] }, '$hits'] },
        expiresAt: { $add: ['$$NOW', windowMs] },
      },
    },
  ];

  const update = () =>
    RateLimit.collection.findOneAndUpdate({ _id: key } as never, pipeline, {
      upsert: true,
      returnDocument: 'after',
    }) as Promise<RateLimitState | null>;

  let state: RateLimitState | null;
  try {
    state = await update();
  } catch (err) {
    // Two first-ever attempts can race to create the document. One wins; retry the other.
    if (!isDuplicateKeyError(err)) throw err;
    state = await update();
  }
  if (!state) throw new Error(`rate limit update returned no document for ${key}`);
  if (state.allowed) return { allowed: true };

  const oldest = state.hits[0]?.getTime() ?? state.checkedAt.getTime();
  const msLeft = oldest + windowMs - state.checkedAt.getTime();
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)) };
}
