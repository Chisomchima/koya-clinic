import { beforeAll, describe, expect, it } from 'vitest';
import { SEED_SLOTS, api, book, isoFromNow, resetSlots, uniqueEmail } from './helpers.js';

beforeAll(resetSlots);

describe('Level 1: GET /slots', () => {
  it('lists every slot earliest first, with availability', async () => {
    const res = await api('GET', '/slots');
    expect(res.status).toBe(200);
    expect(res.body.slots.slice(0, 4).map((s: { id: string }) => s.id)).toEqual([
      'past',
      's1',
      's2',
      's3',
    ]);
    expect(res.body.slots).toHaveLength(SEED_SLOTS.length);
    // start/end are echoed exactly as they were sent
    expect(res.body.slots[1]).toEqual({ ...SEED_SLOTS[1], available: true });
  });

  it('filters by provider with an exact, case-sensitive match', async () => {
    const res = await api('GET', `/slots?provider=${encodeURIComponent('Dr Bello')}`);
    expect(res.body.slots.map((s: { id: string }) => s.id)).toEqual(['s2']);
    expect((await api('GET', '/slots?provider=dr%20bello')).body.slots).toEqual([]);
  });

  it('rejects a repeated provider parameter with 400', async () => {
    expect((await api('GET', '/slots?provider=a&provider=b')).status).toBe(400);
  });

  it('marks a slot unavailable while it has a confirmed booking', async () => {
    expect((await book('p0', uniqueEmail('avail'))).status).toBe(201);
    const slots = await api('GET', '/slots');
    expect(slots.body.slots.find((s: { id: string }) => s.id === 'p0').available).toBe(false);
  });
});

describe('Level 1: POST /reset', () => {
  it.each([
    ['not an object', 'nope'],
    ['slots is not an array', { slots: 'nope' }],
    [
      'a slot without a provider',
      { slots: [{ id: 'a', start: isoFromNow(60), end: isoFromNow(90) }] },
    ],
    [
      'an invalid date',
      { slots: [{ id: 'a', provider: 'Dr A', start: 'soon', end: isoFromNow(90) }] },
    ],
    [
      'duplicate slot ids',
      {
        slots: [
          { id: 'a', provider: 'Dr A', start: isoFromNow(60), end: isoFromNow(90) },
          { id: 'a', provider: 'Dr A', start: isoFromNow(90), end: isoFromNow(120) },
        ],
      },
    ],
  ])('rejects %s with 400', async (_case, body) => {
    const res = await api('POST', '/reset', { body });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('replaces all slots, deletes every booking, and accepts numeric ids', async () => {
    const booked = await book('s1', uniqueEmail('before-reset'));
    expect(booked.status).toBe(201);

    const reset = await api('POST', '/reset', {
      body: { slots: [{ id: 7, provider: 'Dr Z', start: isoFromNow(60), end: isoFromNow(90) }] },
    });
    expect(reset.status).toBe(200);

    const slots = await api('GET', '/slots');
    expect(slots.body.slots.map((s: { id: string }) => s.id)).toEqual(['7']);
    expect((await api('GET', `/bookings/${booked.body.id}`)).status).toBe(404);

    await resetSlots(); // leave the standard slots for any later test
  });
});
