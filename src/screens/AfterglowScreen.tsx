import type { AfterglowStats } from '../domain/afterglow';

export function AfterglowScreen({ stats, onDone }: { stats: AfterglowStats; onDone: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 p-5 text-center">
      <h1 className="text-5xl font-extrabold text-amber-300">Afterglow</h1>
      <p className="text-2xl">You showed up. That is the whole win.</p>
      <dl className="grid grid-cols-3 gap-3">
        {[
          ['Day streak', stats.streakDays],
          ['This week', stats.sessionsLast7Days],
          ['All sessions', stats.totalSessions],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-slate-800 p-4">
            <dt className="text-base text-slate-300">{label}</dt>
            <dd className="text-4xl font-black">{value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" onClick={onDone} className="min-h-20 rounded-2xl bg-emerald-400 text-3xl font-extrabold text-slate-900">
        Done
      </button>
    </main>
  );
}
