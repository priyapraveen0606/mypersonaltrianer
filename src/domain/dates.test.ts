import { describe, expect, it } from 'vitest';
import { daysBetween, toLocalDate } from './dates';

describe('dates', () => {
  it('formats local dates', () => {
    expect(toLocalDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
  it('counts whole days across month boundaries', () => {
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
    expect(daysBetween('2026-11-21', '2026-11-21')).toBe(0);
  });
});
