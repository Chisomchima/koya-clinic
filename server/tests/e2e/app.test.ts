import { describe, expect, it } from 'vitest';
import { api } from './helpers.js';

describe('server basics', () => {
  it('has a public health check', async () => {
    const res = await api('GET', '/health', { apiKey: null });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it.each(['/', '/book', '/booking/KC-ABCDE-FGHJK'])('serves the web page at %s', async (path) => {
    const res = await api('GET', path, { apiKey: null });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
  });

  it('answers unknown paths with JSON: 401 without a key, 404 with one', async () => {
    expect((await api('GET', '/nope', { apiKey: null })).status).toBe(401);
    const res = await api('GET', '/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not found' });
  });

  it('rejects malformed JSON with 400 and { error }', async () => {
    const res = await api('POST', '/bookings', { body: '{bad json', raw: true });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('sends security headers and hides the framework', async () => {
    const res = await api('GET', '/health', { apiKey: null });
    expect(res.headers.get('content-security-policy')).toBeTruthy();
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});
