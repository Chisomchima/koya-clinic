import { describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../test/render';
import { ApiError, request } from './http';

describe('request', () => {
  it('calls the same-origin /web routes and returns the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { slots: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request('/slots')).resolves.toEqual({ slots: [] });
    expect(fetchMock).toHaveBeenCalledWith('/web/slots', expect.any(Object));
  });

  it('never sends an API key from the browser', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, {}));
    vi.stubGlobal('fetch', fetchMock);

    await request('/bookings', { method: 'POST', body: '{}' });
    const headers = fetchMock.mock.calls[0]![1].headers as Record<string, string>;
    expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain('x-api-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('turns an error response into an ApiError with its message and Retry-After', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse(429, { error: 'too many' }, { 'Retry-After': '17' })),
    );

    const err = await request('/bookings').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, message: 'too many', retryAfterSeconds: 17 });
  });

  it('copes with an error response that is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 })));
    await expect(request('/slots')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed (502)',
    });
  });
});
