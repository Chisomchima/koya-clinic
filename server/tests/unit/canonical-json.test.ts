import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256 } from '../../src/lib/canonical-json.js';

describe('canonicalJson', () => {
  it('produces the same string regardless of key order', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonicalJson({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });

  it('keeps array order (order is meaningful in arrays)', () => {
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it('treats undefined as null and handles primitives', () => {
    expect(canonicalJson(undefined)).toBe('null');
    expect(canonicalJson('x')).toBe('"x"');
    expect(canonicalJson({ a: [true, null, 1.5] })).toBe('{"a":[true,null,1.5]}');
  });
});

describe('sha256', () => {
  it('is a stable 64-character hex digest', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
