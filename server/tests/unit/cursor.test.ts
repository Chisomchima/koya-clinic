import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor } from '../../src/lib/cursor.js';
import { HttpError } from '../../src/lib/http-error.js';

describe('pagination cursors', () => {
  it('round-trips a position', () => {
    const position = { createdAt: new Date('2026-11-12T10:00:00.123Z'), id: 'KC-ABCDE-FGHJK' };
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it('is opaque and URL-safe', () => {
    const cursor = encodeCursor({ createdAt: new Date(), id: 'KC-ABCDE-FGHJK' });
    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it.each([
    ['garbage', 'not base64 JSON'],
    [Buffer.from('{"t":"x","id":"a"}').toString('base64url'), 'wrong field types'],
    [Buffer.from('{"t":1}').toString('base64url'), 'missing id'],
    ['', 'empty'],
  ])('rejects %j (%s) with a 400', (raw) => {
    expect(() => decodeCursor(raw)).toThrow(HttpError);
    try {
      decodeCursor(raw);
    } catch (err) {
      expect((err as HttpError).status).toBe(400);
    }
  });
});
