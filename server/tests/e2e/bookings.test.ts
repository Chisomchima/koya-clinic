import { beforeAll, describe, expect, it } from 'vitest';
import { api, book, resetSlots, uniqueEmail } from './helpers.js';

beforeAll(resetSlots);

describe('Level 1: book a slot and look it up', () => {
  it('books a slot (201, confirmed) and looks it up', async () => {
    const created = await book('s1', 'ada@example.com');
    expect(created.status).toBe(201);
    expect(created.body).toEqual({
      id: expect.stringMatching(/^KC-[A-Z2-9]{5}-[A-Z2-9]{5}$/),
      slot_id: 's1',
      name: 'Ada Obi',
      email: 'ada@example.com',
      status: 'confirmed',
      created_at: expect.any(String),
    });
    expect(new Date(created.body.created_at).toISOString()).toBe(created.body.created_at);

    const fetched = await api('GET', `/bookings/${created.body.id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(created.body);
  });

  it('returns 404 with { error } for an unknown booking', async () => {
    const res = await api('GET', '/bookings/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});

describe('Level 2: API key', () => {
  const routes: [string, string][] = [
    ['GET', '/slots'],
    ['POST', '/bookings'],
    ['GET', '/bookings?email=a@b.co'],
    ['GET', '/bookings/x'],
    ['DELETE', '/bookings/x'],
    ['POST', '/reset'],
  ];

  it.each(routes)('%s %s returns 401 without a key or with a wrong key', async (method, path) => {
    for (const apiKey of [null, 'wrong-key', '']) {
      const res = await api(method, path, { apiKey });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: expect.any(String) });
    }
  });
});

describe('Level 2: validation', () => {
  it('rejects missing, empty or mistyped fields with 400', async () => {
    const email = uniqueEmail('validation');
    const bodies = [
      {},
      { slot_id: 's2', name: 'Ada' },
      { slot_id: 's2', email },
      { name: 'Ada', email },
      { slot_id: '', name: 'Ada', email },
      { slot_id: 's2', name: '   ', email },
      { slot_id: 's2', name: 'Ada', email: '' },
      { slot_id: 's2', name: 42, email },
    ];
    for (const body of bodies) {
      const res = await api('POST', '/bookings', { body });
      expect(res.status, JSON.stringify(body)).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    }
  });

  it.each(['nope', 'a@b', 'a b@c.com', '@c.com'])('rejects invalid email %j', async (email) => {
    expect((await book('s2', email)).status).toBe(400);
  });

  it('returns 404 for an unknown slot and 400 for a slot that already started', async () => {
    expect((await book('no-such-slot', uniqueEmail('missing'))).status).toBe(404);
    expect((await book('past', uniqueEmail('past'))).status).toBe(400);
  });

  it('trims name and email, and stores email in lower case', async () => {
    const res = await api('POST', '/bookings', {
      body: { slot_id: 's2', name: '  Bola  ', email: '  Bola.X@Example.COM ' },
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Bola');
    expect(res.body.email).toBe('bola.x@example.com');
  });
});

describe('Level 3: no double booking', () => {
  it('returns 409 for a slot that already has a confirmed booking', async () => {
    expect((await book('s1', uniqueEmail('taken'))).status).toBe(409);
  });

  it('lets exactly one of 25 simultaneous bookings for a slot through', async () => {
    const results = await Promise.all(
      Array.from({ length: 25 }, (_, i) => book('s3', uniqueEmail(`race${i}`))),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(24);
  });
});

describe('Level 3: cancellation', () => {
  it('cancels a booking, frees the slot, and rejects a second cancel with 409', async () => {
    const created = await book('p30', uniqueEmail('cancel'));
    expect(created.status).toBe(201);

    const cancelled = await api('DELETE', `/bookings/${created.body.id}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body).toEqual({ ...created.body, status: 'cancelled' });
    expect((await api('GET', `/bookings/${created.body.id}`)).body.status).toBe('cancelled');

    expect((await api('DELETE', `/bookings/${created.body.id}`)).status).toBe(409);
    expect((await api('DELETE', '/bookings/does-not-exist')).status).toBe(404);

    const slots = await api('GET', '/slots');
    expect(slots.body.slots.find((s: { id: string }) => s.id === 'p30').available).toBe(true);
    expect((await book('p30', uniqueEmail('rebook'))).status).toBe(201);
  });

  it('lets exactly one of several simultaneous cancels succeed', async () => {
    const created = await book('p31', uniqueEmail('cancel-race'));
    const results = await Promise.all(
      Array.from({ length: 5 }, () => api('DELETE', `/bookings/${created.body.id}`)),
    );
    const statuses = results.map((r) => r.status);
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
  });
});
