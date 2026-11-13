import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { api, book, resetSlots, uniqueEmail, web } from './helpers.js';

beforeAll(resetSlots);

const withKey = (key: string) => ({ 'Idempotency-Key': key });

describe('Level 4: Idempotency-Key', () => {
  it('replays the same response for the same key and body', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem');
    const first = await book('p0', email, withKey(key));
    const retry = await book('p0', email, withKey(key));

    expect(first.status).toBe(201);
    expect(first.headers.get('idempotent-replayed')).toBeNull();
    expect(retry.status).toBe(201);
    expect(retry.body).toEqual(first.body);
    expect(retry.headers.get('idempotent-replayed')).toBe('true');

    const list = await api('GET', `/bookings?email=${encodeURIComponent(email)}`);
    expect(list.body.bookings).toHaveLength(1);
  });

  it('treats bodies with the same fields in a different order as the same request', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-order');
    const first = await api('POST', '/bookings', {
      body: { slot_id: 'p1', name: 'Ada Obi', email },
      headers: withKey(key),
    });
    const retry = await api('POST', '/bookings', {
      body: { email, name: 'Ada Obi', slot_id: 'p1' },
      headers: withKey(key),
    });
    expect(retry.status).toBe(201);
    expect(retry.body.id).toBe(first.body.id);
  });

  it('creates one booking when retries with the same key arrive at the same time', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-race');
    const results = await Promise.all(
      Array.from({ length: 5 }, () => book('p2', email, withKey(key))),
    );
    expect(results.map((r) => r.status)).toEqual([201, 201, 201, 201, 201]);
    expect(new Set(results.map((r) => r.body.id)).size).toBe(1);
    // exactly one request created it; the other four were answered with that booking
    const replays = results.filter((r) => r.headers.get('idempotent-replayed') === 'true');
    expect(replays).toHaveLength(4);
  });

  it('returns 422 when a key is reused with a different body', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-422');
    expect((await book('p3', email, withKey(key))).status).toBe(201);
    const res = await book('p4', email, withKey(key));
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('does not store failures: retrying a failed request runs it again', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-error');
    expect((await book('no-such-slot', email, withKey(key))).status).toBe(404);
    expect((await book('no-such-slot', email, withKey(key))).status).toBe(404);
    // the key was never tied to a booking, so it still works once the request is valid
    expect((await book('p5', email, withKey(key))).status).toBe(201);
  });

  it('answers retries of a successful booking without using up rate-limit attempts', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-limit');
    const first = await book('p6', email, withKey(key));
    expect(first.status).toBe(201);
    for (let i = 0; i < 7; i++) {
      const retry = await book('p6', email, withKey(key));
      expect(retry.status).toBe(201);
      expect(retry.body.id).toBe(first.body.id);
    }
    // only one attempt was counted, so a new booking for the same email still goes through
    expect((await book('p7', email)).status).toBe(201);
  });

  it('scopes keys per channel: the API and the web page cannot collide', async () => {
    const key = randomUUID();
    const viaApi = await book('p8', uniqueEmail('scope-api'), withKey(key));
    const viaWeb = await web('POST', '/bookings', {
      body: { slot_id: 'p9', name: 'Ada Obi', email: uniqueEmail('scope-web') },
      headers: withKey(key),
    });
    expect(viaApi.status).toBe(201);
    expect(viaWeb.status).toBe(201);
    expect(viaWeb.body.id).not.toBe(viaApi.body.id);
  });

  it('replays the booking as it is now, e.g. after it was cancelled', async () => {
    const key = randomUUID();
    const email = uniqueEmail('idem-cancel');
    const first = await book('p10', email, withKey(key));
    await api('DELETE', `/bookings/${first.body.id}`);
    const retry = await book('p10', email, withKey(key));
    expect(retry.status).toBe(201);
    expect(retry.body).toEqual({ ...first.body, status: 'cancelled' });
  });

  it('rejects a key longer than 255 characters with 400', async () => {
    const res = await book('p11', uniqueEmail('idem-long'), withKey('k'.repeat(256)));
    expect(res.status).toBe(400);
  });
});
