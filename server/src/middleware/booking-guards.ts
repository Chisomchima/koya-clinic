import { EMAIL_RATE_LIMIT, WEB_IP_RATE_LIMIT } from '../config/constants.js';
import { normalizeEmail } from '../modules/bookings/bookings.schema.js';
import { rateLimit } from './rate-limit.js';

/** Level 5. Runs before validation, so failed attempts count too. */
export const limitAttemptsPerEmail = rateLimit({
  ...EMAIL_RATE_LIMIT,
  keyFor: (req) => {
    const email = normalizeEmail((req.body as { email?: unknown } | undefined)?.email);
    return email ? `email:${email}` : undefined;
  },
  message: 'too many booking attempts for this email, please try again later',
});

/** Web page only, so cycling through emails doesn't help a spammer. */
export const limitAttemptsPerIp = rateLimit({
  ...WEB_IP_RATE_LIMIT,
  keyFor: (req) => `ip:${req.ip}`,
  message: 'too many booking attempts from this device, please try again later',
});
