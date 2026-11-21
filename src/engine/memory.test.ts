import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../storage/sessionLog';
import { recentFocus } from './memory';

const log = (date: string, completedAt: number, primaryFocus: SessionLog['primaryFocus']): SessionLog => ({
  date,
  completedAt,
  primaryFocus,
  mood: 'strong',
  durationMin: 30,
  exercisesCompleted: [],
  rating: null,
});

describe('recentFocus (yesterday’s memory)', () => {
  it('returns the focus of the latest session from yesterday', () => {
    expect(recentFocus([log('2026-11-20', 1, 'lower-body')], '2026-11-21')).toBe('lower-body');
  });
  it('prefers a session already done today', () => {
    expect(recentFocus([log('2026-11-20', 1, 'lower-body'), log('2026-11-21', 2, 'cardio')], '2026-11-21')).toBe('cardio');
  });
  it('forgets sessions older than yesterday', () => {
    expect(recentFocus([log('2026-11-19', 1, 'lower-body')], '2026-11-21')).toBeNull();
    expect(recentFocus([], '2026-11-21')).toBeNull();
  });
});
