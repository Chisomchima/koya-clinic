import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError } from '../../src/lib/mongo-errors.js';

describe('isDuplicateKeyError', () => {
  it('recognises a unique index violation', () => {
    expect(isDuplicateKeyError({ code: 11000, keyPattern: { slotId: 1 } })).toBe(true);
  });

  it('ignores other errors', () => {
    expect(isDuplicateKeyError(new Error('boom'))).toBe(false);
    expect(isDuplicateKeyError({ code: 11001 })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
  });
});
