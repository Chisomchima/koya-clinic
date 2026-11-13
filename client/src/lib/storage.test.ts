import { describe, expect, it, vi } from 'vitest';
import { onboarding, recentBookings } from './storage';

const booking = (id: string) => ({
  id,
  provider: 'Dr Ade',
  start: '2030-01-01T09:00:00Z',
  end: '2030-01-01T09:30:00Z',
});

describe('onboarding', () => {
  it('remembers that the tour was seen', () => {
    expect(onboarding.isDone()).toBe(false);
    onboarding.markDone();
    expect(onboarding.isDone()).toBe(true);
  });
});

describe('recentBookings', () => {
  it('keeps the newest first, without duplicates, up to five', () => {
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f']) recentBookings.add(booking(id));
    recentBookings.add(booking('c'));
    expect(recentBookings.list().map((b) => b.id)).toEqual(['c', 'f', 'e', 'd', 'b']);
  });

  it('survives corrupted data', () => {
    localStorage.setItem('koya:recent-bookings', '{not json');
    expect(recentBookings.list()).toEqual([]);
  });

  it('survives storage being unavailable (e.g. private mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => recentBookings.add(booking('a'))).not.toThrow();
    expect(recentBookings.list()).toEqual([]);
    expect(onboarding.isDone()).toBe(false);
  });
});
