import { Router } from 'express';
import { limitAttemptsPerEmail, limitAttemptsPerIp } from '../middleware/booking-guards.js';
import { idempotency } from '../middleware/idempotency.js';
import * as bookings from '../modules/bookings/bookings.controller.js';
import * as slots from '../modules/slots/slots.controller.js';

/**
 * The web page's backend: the same handlers as the API, without the API key (which anyone
 * could read in the browser). Only patient actions: no /reset, no listing by email.
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
