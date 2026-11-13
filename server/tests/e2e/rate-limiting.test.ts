import { beforeAll, describe, expect, it } from 'vitest';
import { book, resetSlots, uniqueEmail } from './helpers.js';

beforeAll(resetSlots);

describe('Level 5: at most 5 booking attempts per email per minute', () => {
  it('returns 429 with Retry-After on the 6th attempt, counting failed attempts', async () => {
    const email = uniqueEmail('spam');
    expect((await book('no-such-slot', email)).status).toBe(404);
    expect((await book('past', email)).status).toBe(400);
    for (const slot of ['p20', 'p21', 'p22']) expect((await book(slot, email)).status).toBe(201);

    const blocked = await book('p23', email);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({ error: expect.any(String) });
    const retryAfter = Number(blocked.headers.get('retry-after'));
    expect(Number.isInteger(retryAfter)).toBe(true);
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);

    // different casing or spacing of the same address shares the limit
    expect((await book('p23', email.toUpperCase())).status).toBe(429);
    expect((await book('p23', `  ${email}  `)).status).toBe(429);
  });

  it('does not affect other emails', async () => {
    expect((await book('p24', uniqueEmail('other'))).status).toBe(201);
  });

  it('lets exactly 5 of 12 simultaneous attempts through', async () => {
    const email = uniqueEmail('burst');
    const results = await Promise.all(
      Array.from({ length: 12 }, () => book('no-such-slot', email)),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 429)).toHaveLength(7);
    expect(statuses.filter((s) => s === 404)).toHaveLength(5);
  });
});
