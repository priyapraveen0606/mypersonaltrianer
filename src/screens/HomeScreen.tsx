import { useState } from 'react';
import type { AfterglowStats } from '../domain/afterglow';
import { DURATIONS_MIN, MOODS, type DurationMin, type Mood, type PrimaryFocus } from '../domain/types';
import { FOCUS_LABELS, MOOD_LABELS } from './labels';

interface Props {
  recentFocus: PrimaryFocus | null;
  stats: AfterglowStats;
  onStart: (mood: Mood, durationMin: DurationMin) => void;
}

const choice = (selected: boolean) =>
  `min-h-16 rounded-2xl px-4 py-3 text-left text-xl font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400 ${
    selected ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-50 active:bg-slate-700'
  }`;

export function HomeScreen({ recentFocus, stats, onStart }: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [duration, setDuration] = useState<DurationMin | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 p-5">
      <header>
        <h1 className="text-3xl font-extrabold">How are you feeling?</h1>
        {stats.streakDays > 0 && (
          <p className="mt-1 text-lg text-amber-300">{stats.streakDays}-day streak. Lovely to see you.</p>
        )}
        {recentFocus === 'lower-body' && (
          <p className="mt-1 text-lg text-sky-300">
            Last session was {FOCUS_LABELS[recentFocus]} — today leans on back, arms &amp; cardio.
          </p>
        )}
      </header>

      <section aria-labelledby="mood-label">
        <h2 id="mood-label" className="sr-only">Mood</h2>
        <div role="radiogroup" aria-labelledby="mood-label" className="grid gap-3">
          {MOODS.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mood === m} className={choice(mood === m)} onClick={() => setMood(m)}>
              {MOOD_LABELS[m].title}
              <span className="block text-base font-medium opacity-80">{MOOD_LABELS[m].hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="time-label">
        <h2 id="time-label" className="mb-2 text-2xl font-bold">How long?</h2>
        <div role="radiogroup" aria-labelledby="time-label" className="grid grid-cols-4 gap-3">
          {DURATIONS_MIN.map((d) => (
            <button key={d} type="button" role="radio" aria-checked={duration === d} className={`${choice(duration === d)} text-center`} onClick={() => setDuration(d)}>
              {d} min
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={!mood || !duration}
        onClick={() => mood && duration && onStart(mood, duration)}
        className="mt-auto min-h-20 rounded-2xl bg-emerald-400 text-3xl font-extrabold text-slate-900 disabled:bg-slate-700 disabled:text-slate-400"
      >
        Start
      </button>
    </main>
  );
}
