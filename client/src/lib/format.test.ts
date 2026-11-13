import { describe, expect, it } from 'vitest';
import { dayKey, durationMinutes, initials, monthGrid, parseDayKey, relativeDay } from './format';

describe('monthGrid', () => {
  it('starts on Monday and pads to whole weeks', () => {
    // 1 January 2030 is a Tuesday, so one blank cell comes first.
    const cells = monthGrid(new Date(2030, 0, 15));
    expect(cells[0]).toBeNull();
    expect(cells[1]?.getDate()).toBe(1);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });

  it('handles February in a leap year', () => {
    expect(monthGrid(new Date(2028, 1, 1)).filter(Boolean)).toHaveLength(29);
  });
});

describe('dayKey / parseDayKey', () => {
  it('round-trips a local calendar day', () => {
    const date = new Date(2030, 4, 7, 15, 30);
    expect(dayKey(date)).toBe('2030-05-07');
    expect(parseDayKey('2030-05-07').getDate()).toBe(7);
  });
});

describe('relativeDay', () => {
  const now = new Date(2030, 0, 10, 9, 0);
  it('says today and tomorrow, and a short date otherwise', () => {
    expect(relativeDay(new Date(2030, 0, 10, 17).toISOString(), now)).toBe('today');
    expect(relativeDay(new Date(2030, 0, 11, 8).toISOString(), now)).toBe('tomorrow');
    expect(relativeDay(new Date(2030, 0, 14, 8).toISOString(), now)).not.toMatch(/today|tomorrow/);
  });
});

describe('initials', () => {
  it.each([
    ['Dr Ade', 'A'],
    ['Ada Obi', 'AO'],
    ['dr. bello okafor', 'BO'],
    ['Prof Chika Nwosu Eze', 'CN'],
  ])('%s → %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('durationMinutes', () => {
  it('measures the slot length', () => {
    expect(durationMinutes('2030-01-01T09:00:00Z', '2030-01-01T09:45:00Z')).toBe(45);
  });
});
