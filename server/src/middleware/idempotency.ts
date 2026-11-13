import type { RequestHandler } from 'express';
import { canonicalJson, sha256 } from '../lib/canonical-json.js';
import { badRequest } from '../lib/http-error.js';
import { findIdempotentBooking } from '../modules/bookings/bookings.service.js';

/**
 * Level 4: the optional Idempotency-Key header on POST /bookings.
 *
 * The key is stored on the booking it creates (unique index), so "this key was used"
 * and "this booking exists" are the same fact, saved in one atomic write.
 *
 * This middleware runs before rate limiting, so a retry of a request that already
 * succeeded is answered straight away (same 201, same booking id) without using up an
 * attempt. A key reused with a different body gets 422. Otherwise the key and body hash
 * are passed on to the booking service via res.locals.
 *
 * Keys are scoped per channel ("api:" / "web:"), so one client can't collide with another.
 */
export const idempotency =
  ({ scope }: { scope: string }): RequestHandler =>
  async (req, res, next) => {
    const header = req.get('Idempotency-Key');
    if (header === undefined) return next();
    if (header.length === 0 || header.length > 255) {
      throw badRequest('Idempotency-Key must be 1 to 255 characters');
    }

    const context = {
      key: `${scope}:${header}`,
      requestHash: sha256(canonicalJson(req.body ?? null)),
    };

    const existing = await findIdempotentBooking(context); // throws 422 on a body mismatch
    if (existing) {
      res.set('Idempotent-Replayed', 'true').status(201).json(existing);
      return;
    }

    res.locals.idempotency = context;
    next();
  };
