import type { IdempotencyContext } from '../modules/bookings/bookings.service.js';

declare global {
  namespace Express {
    interface Locals {
      /** Set by the idempotency middleware when the request has an Idempotency-Key. */
      idempotency?: IdempotencyContext;
    }
  }
}
