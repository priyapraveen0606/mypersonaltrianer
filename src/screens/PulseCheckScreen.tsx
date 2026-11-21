import { RATINGS, type Rating } from '../domain/types';

const LABELS: Record<Rating, string> = { easy: 'Easy', 'just-right': 'Just Right', 'too-hard': 'Too Hard' };

export function PulseCheckScreen({ onRate }: { onRate: (rating: Rating) => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-5 p-5">
      <h1 className="text-center text-4xl font-extrabold">How did that feel?</h1>
      {RATINGS.map((r) => (
        <button key={r} type="button" onClick={() => onRate(r)} className="min-h-20 rounded-2xl bg-slate-800 text-3xl font-bold active:bg-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400">
          {LABELS[r]}
        </button>
      ))}
    </main>
  );
}
