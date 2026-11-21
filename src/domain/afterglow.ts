import type { SessionLog } from '../storage/sessionLog';
import { daysBetween } from './dates';

export interface AfterglowStats {
  streakDays: number;
  totalSessions: number;
  sessionsLast7Days: number;
}

export function afterglowStats(sessions: readonly SessionLog[], today: string): AfterglowStats {
  const days = new Set(sessions.map((s) => s.date));
  const ages = new Set([...days].map((d) => daysBetween(d, today)).filter((a) => a >= 0));
  let start = ages.has(0) ? 0 : ages.has(1) ? 1 : -1;
  let streakDays = 0;
  if (start >= 0) {
    while (ages.has(start)) {
      streakDays++;
      start++;
    }
  }
  const sessionsLast7Days = sessions.filter((s) => {
    const age = daysBetween(s.date, today);
    return age >= 0 && age < 7;
  }).length;
  return { streakDays, totalSessions: sessions.length, sessionsLast7Days };
}
