import { badRequest } from './http-error.js';

/** The last booking on a page. Bookings are ordered by (createdAt, id). */
interface CursorPosition {
  createdAt: Date;
  id: string;
}

/** Cursors are opaque to clients: base64url-encoded JSON. */
export const encodeCursor = ({ createdAt, id }: CursorPosition) =>
  Buffer.from(JSON.stringify({ t: createdAt.getTime(), id })).toString('base64url');

export function decodeCursor(raw: string): CursorPosition {
  try {
    const { t, id } = JSON.parse(Buffer.from(raw, 'base64url').toString()) as {
      t: unknown;
      id: unknown;
    };
    if (typeof t === 'number' && typeof id === 'string' && id)
      return { createdAt: new Date(t), id };
  } catch {
    // not valid base64url JSON
  }
  throw badRequest('cursor is not valid');
}
