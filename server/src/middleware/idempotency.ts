import type { RequestHandler, Response } from 'express';
import { IDEMPOTENCY } from '../config/constants.js';
import { canonicalJson, sha256 } from '../lib/canonical-json.js';
import { badRequest, conflict, unprocessable } from '../lib/http-error.js';
import { logger } from '../lib/logger.js';
import { isDuplicateKeyError } from '../lib/mongo-errors.js';
import { sleep } from '../lib/sleep.js';
import { IdempotencyKey } from '../models/idempotency-key.model.js';

type Claim = { kind: 'owner' } | { kind: 'replay'; status: number; body: unknown };

/**
 * Level 4: the optional Idempotency-Key header.
 *
 * The first request with a key claims it by inserting a document (the key is the _id,
 * so only one insert can win). It then runs normally, and its response is stored before
 * it is sent. Any later request with the same key and body gets that stored response
 * replayed. If it arrives while the first is still running, it waits for the result.
 * The same key with a different body is rejected with 422.
 *
 * 429 and 5xx responses are not stored: they are temporary, so a later retry should
 * be able to succeed.
 */
export const idempotency = (): RequestHandler => async (req, res, next) => {
  const key = req.get('Idempotency-Key');
  if (key === undefined) return next();
  if (key.length === 0 || key.length > 255) {
    throw badRequest('Idempotency-Key must be 1 to 255 characters');
  }

  const requestHash = sha256(canonicalJson(req.body ?? null));
  const claim = await claimKey(key, requestHash);

  if (claim.kind === 'replay') {
    res.set('Idempotent-Replayed', 'true');
    res.status(claim.status).json(claim.body);
    return;
  }

  storeResponseBeforeSending(res, key);
  next();
};

async function claimKey(key: string, requestHash: string): Promise<Claim> {
  const deadline = Date.now() + IDEMPOTENCY.waitTimeoutMs;

  while (true) {
    const now = new Date();
    try {
      await IdempotencyKey.create({
        _id: key,
        requestHash,
        state: 'in_progress',
        lockedAt: now,
        expiresAt: new Date(now.getTime() + IDEMPOTENCY.ttlMs),
      });
      return { kind: 'owner' };
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err;
    }

    const existing = await IdempotencyKey.findById(key).lean();
    if (!existing) continue; // released or expired in the meantime; try to claim again

    if (existing.requestHash !== requestHash) {
      throw unprocessable('Idempotency-Key was already used with a different request body');
    }
    if (existing.state === 'completed') {
      return {
        kind: 'replay',
        status: existing.responseStatus ?? 200,
        body: existing.responseBody,
      };
    }

    // Still in progress. If the owner looks crashed, take the key over.
    if (now.getTime() - existing.lockedAt.getTime() > IDEMPOTENCY.staleAfterMs) {
      const takenOver = await IdempotencyKey.findOneAndUpdate(
        { _id: key, state: 'in_progress', lockedAt: existing.lockedAt },
        { $set: { lockedAt: now } },
      );
      if (takenOver) return { kind: 'owner' };
      continue;
    }

    if (Date.now() >= deadline) {
      throw conflict('a request with this Idempotency-Key is still being processed, retry shortly');
    }
    await sleep(IDEMPOTENCY.pollIntervalMs);
  }
}

/** Wraps res.json so the response is saved against the key before it goes out. */
function storeResponseBeforeSending(res: Response, key: string) {
  const sendJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    const status = res.statusCode;
    const temporary = status === 429 || status >= 500;
    const save = temporary
      ? IdempotencyKey.deleteOne({ _id: key })
      : IdempotencyKey.updateOne(
          { _id: key },
          { $set: { state: 'completed', responseStatus: status, responseBody: body } },
        );
    save
      .catch((err: unknown) => logger.error({ err, key }, 'failed to save idempotent response'))
      .finally(() => sendJson(body));
    return res;
  }) as Response['json'];
}
