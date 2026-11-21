import { describe, expect, it } from 'vitest';
import { appendSession, loadSessions, MAX_SESSIONS, rateSession, STORAGE_KEY, type SessionLog } from './sessionLog';

const session = (overrides: Partial<SessionLog> = {}): SessionLog => ({
  date: '2026-11-21',
  completedAt: 1_000,
  mood: 'moody',
  durationMin: 15,
  primaryFocus: 'full-body-flow',
  exercisesCompleted: ['surya-namaskar'],
  rating: null,
  ...overrides,
});

describe('session log persistence', () => {
  it('round-trips sessions through localStorage (survives reload)', () => {
    appendSession(session({ completedAt: 2_000, date: '2026-11-21' }));
    appendSession(session({ completedAt: 1_000, date: '2026-11-20', primaryFocus: 'lower-body' }));
    expect(loadSessions().map((s) => s.completedAt)).toEqual([1_000, 2_000]);
  });

  it('records the pulse-check rating', () => {
    appendSession(session());
    expect(rateSession(1_000, 'easy')).toBe(true);
    expect(loadSessions()[0].rating).toBe('easy');
    expect(rateSession(999, 'easy')).toBe(false);
  });

  it('ignores corrupt JSON and invalid entries instead of crashing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadSessions()).toEqual([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([session(), { date: 'x' }, session({ mood: 'angry' as never })]));
    expect(loadSessions()).toHaveLength(1);
  });

  it(`keeps at most ${MAX_SESSIONS} sessions`, () => {
    const many = Array.from({ length: MAX_SESSIONS + 5 }, (_, i) => session({ completedAt: i }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(many));
    appendSession(session({ completedAt: 99_999 }));
    const stored = loadSessions();
    expect(stored).toHaveLength(MAX_SESSIONS);
    expect(stored.at(-1)?.completedAt).toBe(99_999);
  });
});
