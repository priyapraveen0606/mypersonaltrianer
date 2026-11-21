import { describe, expect, it } from 'vitest';
import type { SessionLog } from '../storage/sessionLog';
import { afterglowStats } from './afterglow';

const on = (date: string, completedAt = 0): SessionLog => ({
  date, completedAt, mood: 'moody', durationMin: 10, primaryFocus: 'full-body-flow', exercisesCompleted: [], rating: null,
});

describe('afterglowStats', () => {
  it('counts consecutive days ending today', () => {
    expect(afterglowStats([on('2026-11-19'), on('2026-11-20'), on('2026-11-21'), on('2026-11-21', 1)], '2026-11-21')).toEqual({
      streakDays: 3, totalSessions: 4, sessionsLast7Days: 4,
    });
  });
  it('keeps the streak alive if today is not done yet', () => {
    expect(afterglowStats([on('2026-11-19'), on('2026-11-20')], '2026-11-21').streakDays).toBe(2);
  });
  it('restarts after a gap day', () => {
    expect(afterglowStats([on('2026-11-17'), on('2026-11-19')], '2026-11-21').streakDays).toBe(0);
    expect(afterglowStats([on('2026-11-01'), on('2026-11-14')], '2026-11-21').sessionsLast7Days).toBe(0);
  });
});
