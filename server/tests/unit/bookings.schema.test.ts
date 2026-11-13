import { describe, expect, it } from 'vitest';
import { HttpError } from '../../src/lib/http-error.js';
import { validate } from '../../src/lib/validate.js';
import {
  CreateBookingBody,
  ListBookingsQuery,
  normalizeEmail,
} from '../../src/modules/bookings/bookings.schema.js';

const errorMessage = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(400);
    return (err as HttpError).message;
  }
  throw new Error('expected a validation error');
};

describe('CreateBookingBody', () => {
  const valid = { slot_id: 's1', name: 'Ada Obi', email: 'ada@example.com' };

  it('trims name and email and lower-cases email', () => {
    expect(
      validate(CreateBookingBody, { slot_id: ' s1 ', name: '  Ada ', email: ' Ada@Example.COM ' }),
    ).toEqual({ slot_id: 's1', name: 'Ada', email: 'ada@example.com' });
  });

  it.each([
    [{ ...valid, slot_id: undefined }, 'slot_id is required'],
    [{ ...valid, name: '   ' }, 'name must not be empty'],
    [{ ...valid, name: 42 }, 'name must be a string'],
    [{ ...valid, email: null }, 'email is required'],
    [{ ...valid, email: 'not-an-email' }, 'email is not valid'],
    [{ ...valid, name: 'x'.repeat(201) }, 'name must be at most 200 characters'],
  ])('rejects %j with "%s"', (body, message) => {
    expect(errorMessage(() => validate(CreateBookingBody, body))).toBe(message);
  });

  it.each([undefined, null, 'text', [1, 2]])('rejects a body that is not an object: %j', (body) => {
    expect(errorMessage(() => validate(CreateBookingBody, body))).toBe(
      'request body must be a JSON object',
    );
  });
});

describe('ListBookingsQuery', () => {
  it('defaults limit to 10 and normalises the email', () => {
    expect(validate(ListBookingsQuery, { email: ' Ada@Example.com ' })).toEqual({
      email: 'ada@example.com',
      limit: 10,
    });
  });

  it.each(['1', '50'])('accepts limit=%s', (limit) => {
    expect(validate(ListBookingsQuery, { email: 'a@b.co', limit }).limit).toBe(Number(limit));
  });

  it.each(['0', '51', '-1', '2.5', 'abc', ''])('rejects limit=%j', (limit) => {
    expect(errorMessage(() => validate(ListBookingsQuery, { email: 'a@b.co', limit }))).toBe(
      'limit must be an integer from 1 to 50',
    );
  });

  it('requires an email', () => {
    expect(errorMessage(() => validate(ListBookingsQuery, {}))).toBe('email is required');
    expect(errorMessage(() => validate(ListBookingsQuery, { email: '  ' }))).toBe(
      'email is required',
    );
  });
});

describe('normalizeEmail', () => {
  it('trims and lower-cases strings, and returns "" for anything else', () => {
    expect(normalizeEmail('  A@B.CO ')).toBe('a@b.co');
    expect(normalizeEmail(42)).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });
});
