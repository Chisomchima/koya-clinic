import { beforeAll, describe, expect, it } from 'vitest';
import { api, book, resetSlots, uniqueEmail, type ApiResponse } from './helpers.js';

beforeAll(resetSlots);

/** Fetches every page for `email`, returning the ids in order and the number of pages. */
async function fetchAllPages(email: string, limit: number) {
  const ids: string[] = [];
  let cursor: string | null = null;
  let pages = 0;
  do {
    const query = `email=${encodeURIComponent(email)}&limit=${limit}`;
    const res: ApiResponse = await api(
      'GET',
      `/bookings?${query}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    );
    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(['bookings', 'next_cursor']);
    ids.push(...res.body.bookings.map((b: { id: string }) => b.id));
    cursor = res.body.next_cursor;
    pages++;
  } while (cursor);
  return { ids, pages };
}

describe('Level 4: GET /bookings pagination', () => {
  it("pages through a person's bookings oldest first, matching email case-insensitively", async () => {
    const email = uniqueEmail('pager');
    const ids: string[] = [];
    for (const slot of ['p10', 'p11', 'p12', 'p13']) ids.push((await book(slot, email)).body.id);

    const result = await fetchAllPages(email.toUpperCase(), 3);
    expect(result.ids).toEqual(ids);
    expect(result.pages).toBe(2);
  });

  it('only returns that person’s bookings', async () => {
    const mine = uniqueEmail('mine');
    await book('p14', mine);
    await book('p15', uniqueEmail('theirs'));
    const res = await api('GET', `/bookings?email=${encodeURIComponent(mine)}`);
    expect(res.body.bookings.map((b: { email: string }) => b.email)).toEqual([mine]);
  });

  it('includes cancelled bookings', async () => {
    const email = uniqueEmail('with-cancelled');
    const booked = await book('p16', email);
    await api('DELETE', `/bookings/${booked.body.id}`);
    const res = await api('GET', `/bookings?email=${encodeURIComponent(email)}`);
    expect(res.body.bookings.map((b: { status: string }) => b.status)).toEqual(['cancelled']);
  });

  it('keeps pages stable when new bookings arrive mid-way (keyset, not offset)', async () => {
    const email = uniqueEmail('stable');
    const existing: string[] = [];
    for (const slot of ['p20', 'p21', 'p22']) existing.push((await book(slot, email)).body.id);

    const base = `/bookings?email=${encodeURIComponent(email)}&limit=2`;
    const page1 = await api('GET', base);
    expect(page1.body.bookings.map((b: { id: string }) => b.id)).toEqual(existing.slice(0, 2));
    expect(page1.body.next_cursor).toEqual(expect.any(String));

    // A booking made while the client is between pages lands after the cursor:
    // page 2 continues exactly where page 1 stopped, with no repeats and nothing skipped.
    const later = (await book('p23', email)).body.id;
    const page2 = await api('GET', `${base}&cursor=${encodeURIComponent(page1.body.next_cursor)}`);
    expect(page2.body.bookings.map((b: { id: string }) => b.id)).toEqual([existing[2], later]);
    expect(page2.body.next_cursor).toBeNull();
  });

  it('returns an empty last page for someone with no bookings', async () => {
    const res = await api('GET', `/bookings?email=${uniqueEmail('nobody')}`);
    expect(res.body).toEqual({ bookings: [], next_cursor: null });
  });

  it.each(['0', '51', 'abc', '-1', '2.5', ''])('rejects limit=%j with 400', async (limit) => {
    const res = await api('GET', `/bookings?email=a@b.co&limit=${limit}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('accepts limit 1 and 50, and rejects a garbage cursor or a missing email', async () => {
    expect((await api('GET', '/bookings?email=a@b.co&limit=1')).status).toBe(200);
    expect((await api('GET', '/bookings?email=a@b.co&limit=50')).status).toBe(200);
    expect((await api('GET', '/bookings?email=a@b.co&cursor=garbage')).status).toBe(400);
    expect((await api('GET', '/bookings')).status).toBe(400);
  });
});
