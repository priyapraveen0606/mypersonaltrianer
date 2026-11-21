import { DURATIONS_MIN, MOODS, PRIMARY_FOCUSES, RATINGS, type DurationMin, type Mood, type PrimaryFocus, type Rating } from '../domain/types';

export interface SessionLog {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** Epoch ms when the session ended; orders multiple sessions on one day. */
  completedAt: number;
  mood: Mood;
  durationMin: DurationMin;
  primaryFocus: PrimaryFocus;
  exercisesCompleted: string[];
  rating: Rating | null;
}

export const STORAGE_KEY = 'mpt:sessions:v1';
export const MAX_SESSIONS = 730;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isSessionLog(v: unknown): v is SessionLog {
  if (typeof v !== 'object' || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.date === 'string' &&
    DATE_RE.test(s.date) &&
    typeof s.completedAt === 'number' &&
    Number.isFinite(s.completedAt) &&
    (MOODS as readonly unknown[]).includes(s.mood) &&
    (DURATIONS_MIN as readonly unknown[]).includes(s.durationMin) &&
    (PRIMARY_FOCUSES as readonly unknown[]).includes(s.primaryFocus) &&
    Array.isArray(s.exercisesCompleted) &&
    s.exercisesCompleted.every((x) => typeof x === 'string') &&
    (s.rating === null || (RATINGS as readonly unknown[]).includes(s.rating))
  );
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** All valid sessions, oldest first. Corrupt or foreign data is ignored, never thrown. */
export function loadSessions(): SessionLog[] {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSessionLog).sort((a, b) => a.completedAt - b.completedAt);
  } catch {
    return [];
  }
}

function saveSessions(sessions: SessionLog[]): boolean {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(-MAX_SESSIONS)));
    return true;
  } catch {
    return false;
  }
}

export function appendSession(session: SessionLog): boolean {
  return saveSessions([...loadSessions(), session]);
}

/** Sets the pulse-check rating on the session completed at `completedAt`. */
export function rateSession(completedAt: number, rating: Rating): boolean {
  const sessions = loadSessions();
  const target = sessions.find((s) => s.completedAt === completedAt);
  if (!target) return false;
  target.rating = rating;
  return saveSessions(sessions);
}
