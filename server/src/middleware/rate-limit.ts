import type { Request, RequestHandler } from 'express';
import { tooManyRequests } from '../lib/http-error.js';
import { consumeRateLimit, type RateLimitRule } from '../lib/rate-limiter.js';

interface RateLimitOptions extends RateLimitRule {
  /** Which bucket this request counts against. Returning undefined skips the limit. */
  keyFor: (req: Request) => string | undefined;
  message: string;
}

export function rateLimit({ keyFor, message, ...rule }: RateLimitOptions): RequestHandler {
  return async (req, _res, next) => {
    const key = keyFor(req);
    if (key === undefined) return next();
    const result = await consumeRateLimit(key, rule);
    if (!result.allowed) throw tooManyRequests(message, result.retryAfterSeconds);
    next();
  };
}
