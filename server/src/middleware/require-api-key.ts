import { createHash, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { unauthorized } from '../lib/http-error.js';

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Level 2: every request must carry the right X-API-Key. Compared in constant time. */
export function requireApiKey(apiKey: string): RequestHandler {
  const expected = digest(apiKey);
  return (req, _res, next) => {
    const given = req.get('X-API-Key');
    if (!given || !timingSafeEqual(digest(given), expected)) throw unauthorized();
    next();
  };
}
