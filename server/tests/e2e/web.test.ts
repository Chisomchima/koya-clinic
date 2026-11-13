import { beforeAll, describe, expect, it } from 'vitest';
import { resetSlots, uniqueEmail, web } from './helpers.js';

beforeAll(resetSlots);

/**
 * The web page's backend (/web/*): the same handlers as the API, reachable without
 * the API key, exposing only what a patient needs.
 */
describe('web page routes', () => {
  it('lists slots without an API key', async () => {
    const res = await web('GET', '/slots');
    expect(res.status).toBe(200);
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('books, looks up and cancels without an API key', async () => {
    const created = await web('POST', '/bookings', {
      body: { slot_id: 's1', name: 'Ada Obi', email: uniqueEmail('web') },
    });
    expect(created.status).toBe(201);
    expect((await web('GET', `/bookings/${created.body.id}`)).body).toEqual(created.body);
    expect((await web('DELETE', `/bookings/${created.body.id}`)).body.status).toBe('cancelled');
  });

  it('applies the same validation as the API', async () => {
    const res = await web('POST', '/bookings', { body: { slot_id: 's2', name: '', email: 'x' } });
    expect(res.status).toBe(400);
  });

  it('does not expose /reset or listing bookings by email', async () => {
    expect((await web('POST', '/reset', { body: { slots: [] } })).status).toBe(401);
    expect((await web('GET', '/bookings?email=a@b.co')).status).toBe(401);
  });

  it('limits booking attempts per IP, and a faked X-Forwarded-For does not get around it', async () => {
    // Behind one proxy, the server trusts only the right-most X-Forwarded-For entry (the one
    // the proxy adds). Faking the entries to its left must not create a fresh rate-limit bucket.
    const attempt = (i: number) =>
      web('POST', '/bookings', {
        body: { slot_id: 'no-such-slot', name: 'Spammer', email: uniqueEmail(`ip${i}`) },
        headers: { 'X-Forwarded-For': `10.0.0.${i}, 203.0.113.7` },
      });

    for (let i = 0; i < 20; i++) expect((await attempt(i)).status).toBe(404);
    const blocked = await attempt(20);
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
  });
});
