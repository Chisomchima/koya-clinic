import type { Request, RequestHandler } from 'express';
import { tooManyRequests } from '../lib/http-error.js';
import { consumeRateLimit, type RateLimitRule } from '../lib/rate-limiter.js';

interface RateLimitOptions extends RateLimitRule {
  /** The bucket this request counts against; undefined skips the limit. */
  keyFor: (req: Request) => string | undefined;
  message: string;
}

export function rateLimit({ keyFor, message, ...rule }: RateLimitOptions): RequestHandler {
  return async (req, _res, next) => {
    const key = keyFor(req);
    const blocked = key === undefined ? null : await consumeRateLimit(key, rule);
    if (blocked) throw tooManyRequests(message, blocked.retryAfterSeconds);
    next();
  };
}
