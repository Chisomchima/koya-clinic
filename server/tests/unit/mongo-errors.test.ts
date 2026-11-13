import { describe, expect, it } from 'vitest';
import { isDuplicateKeyError } from '../../src/lib/mongo-errors.js';

const duplicateOn = (field: string) => ({ code: 11000, keyPattern: { [field]: 1 } });

describe('isDuplicateKeyError', () => {
  it('recognises a unique index violation', () => {
    expect(isDuplicateKeyError(duplicateOn('slotId'))).toBe(true);
  });

  it('can tell which index was violated', () => {
    expect(isDuplicateKeyError(duplicateOn('slotId'), 'slotId')).toBe(true);
    expect(isDuplicateKeyError(duplicateOn('idempotencyKey'), 'slotId')).toBe(false);
  });

  it('ignores other errors', () => {
    expect(isDuplicateKeyError(new Error('boom'))).toBe(false);
    expect(isDuplicateKeyError({ code: 11001 })).toBe(false);
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError({ code: 11000 }, 'slotId')).toBe(false); // no keyPattern
  });
});
