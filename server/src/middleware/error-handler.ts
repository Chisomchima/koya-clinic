import type { ErrorRequestHandler, RequestHandler } from 'express';
import { HttpError } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: 'not found' });
};

/** Every error leaves the API as `{ "error": "<message>" }`. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.set(err.headers).status(err.status).json({ error: err.message });
    return;
  }
  // Errors raised by express.json(), e.g. malformed JSON or a body that is too large.
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'request body is not valid JSON' });
    return;
  }
  if (typeof err?.status === 'number' && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: String(err.message ?? 'bad request') });
    return;
  }
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'internal server error' });
};
