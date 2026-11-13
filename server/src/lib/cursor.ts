import { badRequest } from './http-error.js';

/** Position of the last item on a page. Bookings are ordered by (createdAt, id). */
export interface CursorPosition {
  createdAt: Date;
  id: string;
}

/** Cursors are opaque to clients: base64url-encoded JSON. */
export function encodeCursor({ createdAt, id }: CursorPosition): string {
  return Buffer.from(JSON.stringify({ t: createdAt.getTime(), id })).toString('base64url');
}

export function decodeCursor(raw: string): CursorPosition {
  try {
    const { t, id } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as {
      t: unknown;
      id: unknown;
    };
    if (typeof t === 'number' && Number.isFinite(t) && typeof id === 'string' && id) {
      return { createdAt: new Date(t), id };
    }
  } catch {
    // fall through
  }
  throw badRequest('cursor is not valid');
}
