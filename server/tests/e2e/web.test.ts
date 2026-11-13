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
    // Every attempt fakes a different left-most X-Forwarded-For entry. The server only trusts
    // the right-most one (added by the proxy), so all of them share one bucket of 20.
    // Earlier tests in this file may already have used part of that bucket.
    const attempt = (i: number) =>
      web('POST', '/bookings', {
        body: { slot_id: 'no-such-slot', name: 'Spammer', email: uniqueEmail(`ip${i}`) },
        headers: { 'X-Forwarded-For': `10.0.0.${i}, 203.0.113.7` },
      });

    let blocked;
    for (let i = 0; i <= 20 && !blocked; i++) {
      const res = await attempt(i);
      if (res.status === 429) blocked = res;
      else expect(res.status).toBe(404);
    }
    expect(blocked, 'expected a 429 within 21 attempts').toBeDefined();
    expect(Number(blocked!.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
  });
});
