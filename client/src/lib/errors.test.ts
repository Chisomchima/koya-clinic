import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/http';
import { describeError, isSlotTaken } from './errors';

describe('describeError', () => {
  it('explains a taken slot', () => {
    expect(describeError(new ApiError(409, 'slot is already booked'))).toMatch(/just grabbed/);
  });

  it('includes the wait time for rate limiting', () => {
    expect(describeError(new ApiError(429, 'too many', 42))).toMatch(/in 42 seconds/);
  });

  it('hides server internals for 5xx errors', () => {
    expect(describeError(new ApiError(500, 'MongoServerError: boom'))).toBe(
      'Something went wrong on our side. Please try again.',
    );
  });

  it('shows validation messages as sentences', () => {
    expect(describeError(new ApiError(400, 'email is not valid'))).toBe('Email is not valid.');
  });

  it('treats anything else as a connection problem', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toMatch(/couldn't reach the clinic/);
  });
});

describe('isSlotTaken', () => {
  it('is true only for a 409', () => {
    expect(isSlotTaken(new ApiError(409, 'x'))).toBe(true);
    expect(isSlotTaken(new ApiError(400, 'x'))).toBe(false);
    expect(isSlotTaken(new Error('x'))).toBe(false);
  });
});
