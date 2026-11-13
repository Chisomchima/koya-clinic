import { randomInt } from 'node:crypto';

// No 0/O, 1/I/L: easy to read out over the phone and to type back in.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const randomChars = (n: number) =>
  Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/**
 * A short, human-friendly booking reference such as "KC-7KQ2M-9XH4P".
 * 10 random characters from a 31-letter alphabet give ~50 bits of randomness.
 * The _id unique index still guards against the (very unlikely) collision.
 */
export const newBookingReference = () => `KC-${randomChars(5)}-${randomChars(5)}`;
