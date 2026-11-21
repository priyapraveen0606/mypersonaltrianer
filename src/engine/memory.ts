import { daysBetween } from '../domain/dates';
import type { PrimaryFocus } from '../domain/types';
import type { SessionLog } from '../storage/sessionLog';

/**
 * Primary focus of the most recent session completed today or yesterday (local dates).
 * Older sessions are ignored: after a rest day the muscles have recovered.
 */
export function recentFocus(sessions: readonly SessionLog[], today: string): PrimaryFocus | null {
  let latest: SessionLog | null = null;
  for (const s of sessions) {
    const age = daysBetween(s.date, today);
    if (age < 0 || age > 1) continue;
    if (!latest || s.completedAt > latest.completedAt) latest = s;
  }
  return latest?.primaryFocus ?? null;
}
