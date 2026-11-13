import type { RequestHandler } from 'express';
import { canonicalJson, sha256 } from '../lib/canonical-json.js';
import { badRequest } from '../lib/http-error.js';
import { findIdempotentBooking } from '../modules/bookings/bookings.service.js';

/**
 * Level 4. The Idempotency-Key is saved on the booking it creates, so a retry of a
 * successful request is answered here with that booking, before rate limiting.
 * The same key with a different body is 422. Keys are scoped per channel ("api" / "web").
 */
export const idempotency =
  ({ scope }: { scope: string }): RequestHandler =>
  async (req, res, next) => {
    const header = req.get('Idempotency-Key');
    if (header === undefined) return next();
    if (!header || header.length > 255) {
      throw badRequest('Idempotency-Key must be 1 to 255 characters');
    }

    const context = {
      key: `${scope}:${header}`,
      requestHash: sha256(canonicalJson(req.body ?? null)),
    };
    const existing = await findIdempotentBooking(context);
    if (existing) {
      res.set('Idempotent-Replayed', 'true').status(201).json(existing);
      return;
    }

    res.locals.idempotency = context;
    next();
  };
