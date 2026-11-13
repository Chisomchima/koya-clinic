import { Router } from 'express';
import { limitAttemptsPerEmail, limitAttemptsPerIp } from '../middleware/booking-guards.js';
import { idempotency } from '../middleware/idempotency.js';
import * as bookings from '../modules/bookings/bookings.controller.js';
import * as slots from '../modules/slots/slots.controller.js';

/**
 * Backend-for-frontend for the web page. It runs the same handlers as the API, but
 * the browser never needs the API key: the key would be visible to anyone who opened
 * dev tools. It only exposes what a patient needs (no /reset, no listing by email).
 */
export const webRouter = Router();

webRouter.get('/slots', slots.list);
webRouter.post(
  '/bookings',
  limitAttemptsPerIp,
  idempotency({ scope: 'web' }),
  limitAttemptsPerEmail,
  bookings.create,
);
webRouter.get('/bookings/:id', bookings.getById);
webRouter.delete('/bookings/:id', bookings.cancel);
