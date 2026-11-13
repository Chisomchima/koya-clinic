import { randomUUID } from 'node:crypto';
import { inject } from 'vitest';

export const BASE_URL = (process.env.TEST_BASE_URL ?? inject('baseUrl')).replace(/\/$/, '');
export const API_KEY = process.env.TEST_API_KEY ?? inject('apiKey');

export interface ApiResponse<T = any> {
  status: number;
  body: T;
  headers: Headers;
}

interface RequestOptions {
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass null to send no key. */
  apiKey?: string | null;
  /** Send `body` exactly as given (for malformed JSON tests). */
  raw?: boolean;
}

export async function api<T = any>(
  method: string,
  path: string,
  { body, headers = {}, apiKey = API_KEY, raw = false }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      ...(apiKey !== null && { 'X-API-Key': apiKey }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: body === undefined ? undefined : raw ? String(body) : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = JSON.parse(text);
  } catch {
    // not JSON
  }
  return { status: res.status, body: parsed as T, headers: res.headers };
}

/** Calls the web page's routes (/web/*), which need no API key. */
export const web = <T = any>(method: string, path: string, options: RequestOptions = {}) =>
  api<T>(method, `/web${path}`, { ...options, apiKey: null });

/** A unique email per test, so rate limits from one test never leak into another. */
export const uniqueEmail = (tag: string) => `${tag}-${randomUUID().slice(0, 8)}@example.com`;

export const book = (slotId: string, email: string, headers: Record<string, string> = {}) =>
  api('POST', '/bookings', { body: { slot_id: slotId, name: 'Ada Obi', email }, headers });

/** An ISO time `minutes` from now, rounded to the minute. */
export const isoFromNow = (minutes: number) =>
  new Date(Math.floor(Date.now() / 60_000) * 60_000 + minutes * 60_000)
    .toISOString()
    .replace('.000Z', 'Z');

const DAY = 24 * 60;

export const SEED_SLOTS = [
  { id: 's3', provider: 'Dr Ade', start: isoFromNow(DAY + 60), end: isoFromNow(DAY + 90) },
  { id: 's1', provider: 'Dr Ade', start: isoFromNow(DAY), end: isoFromNow(DAY + 30) },
  { id: 's2', provider: 'Dr Bello', start: isoFromNow(DAY + 30), end: isoFromNow(DAY + 60) },
  { id: 'past', provider: 'Dr Ade', start: isoFromNow(-120), end: isoFromNow(-90) },
  ...Array.from({ length: 40 }, (_, i) => ({
    id: `p${i}`,
    provider: 'Dr Page',
    start: isoFromNow(2 * DAY + i * 30),
    end: isoFromNow(2 * DAY + i * 30 + 30),
  })),
];

export async function resetSlots() {
  const res = await api('POST', '/reset', { body: { slots: SEED_SLOTS } });
  if (res.status !== 200)
    throw new Error(`reset failed: ${res.status} ${JSON.stringify(res.body)}`);
}
