import { describe, expect, it } from 'vitest';
import { newBookingReference } from '../../src/lib/booking-reference.js';

describe('newBookingReference', () => {
  it('looks like KC-XXXXX-XXXXX', () => {
    expect(newBookingReference()).toMatch(/^KC-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  });

  it('never uses look-alike characters (0, O, 1, I, L)', () => {
    const sample = Array.from({ length: 500 }, newBookingReference).join('');
    expect(sample.replace(/^KC-|-KC-|-/g, '')).not.toMatch(/[01OIL]/);
  });

  it('is unique across many draws', () => {
    const refs = new Set(Array.from({ length: 10_000 }, newBookingReference));
    expect(refs.size).toBe(10_000);
  });
});
