import { randomInt } from 'node:crypto';

// No look-alikes (0/O, 1/I/L), so references are easy to read out and type back in.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const randomChars = (n: number) =>
  Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

/** e.g. "KC-7KQ2M-9XH4P": ~50 bits of randomness. */
export const newBookingReference = () => `KC-${randomChars(5)}-${randomChars(5)}`;
