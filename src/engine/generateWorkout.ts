import { EXERCISES, isSafe } from '../domain/exercises';
import type { DurationMin, Exercise, Mood, PrimaryFocus } from '../domain/types';
import { shuffle, type Rng } from './random';

export const FORM_CHECK_SEC = 5;
export const TIME_TOLERANCE_SEC = 60;
/** Each move may be stretched by at most this fraction of its default to hit the exact target. */
const MAX_STRETCH = 0.5;

/** Moods that are exempt from yesterday's-memory rebalancing (SPEC §4.1). */
const MEMORY_EXEMPT_MOODS: readonly Mood[] = ['moody', 'meditative'];
/** Moods whose sessions are performed as consecutive rounds of the same flow. */
const ROUNDS_MOODS: readonly Mood[] = ['moody'];

export type Side = 'right' | 'left';

export interface SessionItem {
  exercise: Exercise;
  /** Set for unilateral moves: each is scheduled as a right set followed by a left set. */
  side?: Side;
  /** 1-based count of this exercise within the session (Surya round 3, set 2, ...). */
  round: number;
  formCheckSec: number;
  workSec: number;
  restSec: number;
}

export interface WorkoutSession {
  mood: Mood;
  durationMin: DurationMin;
  targetSec: number;
  totalSec: number;
  primaryFocus: PrimaryFocus;
  items: SessionItem[];
}

export interface GenerateOptions {
  mood: Mood;
  durationMin: DurationMin;
  /** Primary focus of today's/yesterday's session, from recentFocus(). */
  recentFocus?: PrimaryFocus | null;
  library?: readonly Exercise[];
  rng?: Rng;
}

const isThighTrainer = (e: Exercise) => e.equipment.includes('thigh-trainer');
const isBandedGluteMed = (e: Exercise) =>
  e.equipment.includes('resistance-band') && e.targetMuscle === 'glute-medius';

/** Exercises eligible for this mood after the hard safety filter and yesterday's memory. */
export function eligibleExercises(
  library: readonly Exercise[],
  mood: Mood,
  recent: PrimaryFocus | null | undefined,
): Exercise[] {
  const forMood = library.filter((e) => isSafe(e) && e.moods.includes(mood));
  if (recent === 'lower-body' && !MEMORY_EXEMPT_MOODS.includes(mood)) {
    const rebalanced = forMood.filter((e) => e.primaryFocus !== 'lower-body');
    if (rebalanced.length > 0) return rebalanced;
  }
  return forMood;
}

/**
 * Groups exercises into atomic units. A thigh-trainer move is always followed by a
 * banded glute-medius move in the same unit (Auto-Balance rule), so time-filling can
 * never schedule one without the other. Thigh-trainer moves are dropped if no partner exists.
 */
function buildUnits(pool: Exercise[], library: readonly Exercise[], rng: Rng): Exercise[][] {
  const partners = shuffle(library.filter((e) => isSafe(e) && isBandedGluteMed(e)), rng);
  const units: Exercise[][] = [];
  let p = 0;
  for (const e of shuffle(pool, rng)) {
    if (!isThighTrainer(e)) {
      units.push([e]);
    } else if (partners.length > 0) {
      units.push([e, partners[p++ % partners.length]]);
    }
  }
  return units;
}

const baseCost = (e: Exercise) => e.defaultDurationSec + e.defaultRestSec;
const isBookend = (e: Exercise) => e.primaryFocus === 'warmup' || e.primaryFocus === 'recovery';
/** At most this share of the session goes to warm-up moves (always at least one, if available). */
const WARMUP_SHARE = 0.1;

/** Warm-up moves in library order, while they fit the warm-up share of the session. */
function pickWarmup(warmups: readonly Exercise[], targetSec: number): Exercise[] {
  const picked: Exercise[] = [];
  let sec = 0;
  for (const e of warmups) {
    if (picked.length > 0 && sec + baseCost(e) > targetSec * WARMUP_SHARE) break;
    picked.push(e);
    sec += baseCost(e);
  }
  return picked;
}

/** Base (unscaled) work and rest of an item; scaling stretches from these. */
interface ItemBase {
  workSec: number;
  restSec: number;
}

/** One item per move, or a right set then a left set (each half the work, rest after the left). */
function toItems(exercise: Exercise, round: number, formCheckSec: number, restSec: number): [SessionItem, ItemBase][] {
  if (!exercise.unilateral) {
    const workSec = exercise.defaultDurationSec;
    return [[{ exercise, round, formCheckSec, workSec, restSec }, { workSec, restSec }]];
  }
  const right = Math.ceil(exercise.defaultDurationSec / 2);
  const left = exercise.defaultDurationSec - right;
  return [
    [{ exercise, side: 'right', round, formCheckSec, workSec: right, restSec: 0 }, { workSec: right, restSec: 0 }],
    [{ exercise, side: 'left', round, formCheckSec: 0, workSec: left, restSec }, { workSec: left, restSec }],
  ];
}

export function generateWorkout(options: GenerateOptions): WorkoutSession {
  const { mood, durationMin, recentFocus = null, library = EXERCISES, rng = Math.random } = options;
  const targetSec = durationMin * 60;

  const pool = eligibleExercises(library, mood, recentFocus);
  const cooldown = pool.filter((e) => e.primaryFocus === 'recovery');
  const main = pool.filter((e) => !isBookend(e));
  const units = buildUnits(main.length > 0 ? main : pool, library, rng);
  if (units.length === 0) throw new Error(`No safe exercises available for mood "${mood}"`);

  const warmupExercises = main.length > 0 ? pickWarmup(pool.filter((e) => e.primaryFocus === 'warmup'), targetSec) : [];
  const warmupCost = warmupExercises.reduce(
    (sum, e) => sum + baseCost(e) + (e.requiresFormCheck ? FORM_CHECK_SEC : 0),
    0,
  );
  const cooldownExercise = main.length > 0 ? cooldown[0] : undefined;
  const cooldownCost = cooldownExercise
    ? cooldownExercise.defaultDurationSec + (cooldownExercise.requiresFormCheck ? FORM_CHECK_SEC : 0)
    : 0;
  const seen = new Set<string>();
  const formCheckFor = (e: Exercise) => {
    const first = !seen.has(e.id);
    seen.add(e.id);
    return first && e.requiresFormCheck ? FORM_CHECK_SEC : 0;
  };
  const unitCost = (unit: Exercise[]) =>
    unit.reduce((sum, e) => sum + baseCost(e) + (!seen.has(e.id) && e.requiresFormCheck ? FORM_CHECK_SEC : 0), 0);

  // Fill the main block cyclically with whole units while they fit.
  let chosen: Exercise[] = [];
  let used = warmupCost + cooldownCost;
  const formChecks = new Map<number, number>();
  let i = 0;
  let misses = 0;
  while (misses < units.length) {
    const unit = units[i % units.length];
    i++;
    if (used + unitCost(unit) > targetSec) {
      misses++;
      continue;
    }
    misses = 0;
    for (const e of unit) {
      formChecks.set(chosen.length, formCheckFor(e));
      chosen.push(e);
      used += baseCost(e) + (formChecks.get(chosen.length - 1) ?? 0);
    }
  }

  if (ROUNDS_MOODS.includes(mood)) {
    const order = new Map(units.map((u, idx) => [u[0].id, idx]));
    const indexed = chosen.map((e, idx) => ({ e, fc: formChecks.get(idx) ?? 0 }));
    indexed.sort((a, b) => (order.get(a.e.id) ?? 0) - (order.get(b.e.id) ?? 0));
    chosen = indexed.map((x) => x.e);
    indexed.forEach((x, idx) => formChecks.set(idx, x.fc));
  }

  const rounds = new Map<string, number>();
  const planned: [SessionItem, ItemBase][] = [
    ...warmupExercises.flatMap((e) => toItems(e, 1, e.requiresFormCheck ? FORM_CHECK_SEC : 0, e.defaultRestSec)),
    ...chosen.flatMap((exercise, idx) => {
      const round = (rounds.get(exercise.id) ?? 0) + 1;
      rounds.set(exercise.id, round);
      return toItems(exercise, round, formChecks.get(idx) ?? 0, exercise.defaultRestSec);
    }),
    ...(cooldownExercise ? toItems(cooldownExercise, 1, formCheckFor(cooldownExercise), 0) : []),
  ];
  const last = planned.at(-1);
  if (last) last[0].restSec = last[1].restSec = 0;
  const items = planned.map(([item]) => item);

  scaleToTarget(planned, targetSec);

  const totalSec = sessionTotalSec(items);
  return { mood, durationMin, targetSec, totalSec, primaryFocus: dominantFocus(items), items };
}

export function sessionTotalSec(items: readonly SessionItem[]): number {
  return items.reduce((sum, it) => sum + it.formCheckSec + it.workSec + it.restSec, 0);
}

/** Spreads the leftover seconds over work (then rest) time, at most +50% per move. */
function scaleToTarget(planned: [SessionItem, ItemBase][], targetSec: number): void {
  let slack = targetSec - sessionTotalSec(planned.map(([it]) => it));
  for (const field of ['workSec', 'restSec'] as const) {
    let progress = true;
    while (slack > 0 && progress) {
      progress = false;
      for (const [it, bases] of planned) {
        if (slack <= 0) break;
        const base = bases[field];
        if (field === 'restSec' && base === 0) continue;
        if (it[field] < Math.floor(base * (1 + MAX_STRETCH))) {
          it[field]++;
          slack--;
          progress = true;
        }
      }
    }
  }
}

export function dominantFocus(items: readonly SessionItem[]): PrimaryFocus {
  const totals = new Map<PrimaryFocus, number>();
  for (const it of items) {
    if (isBookend(it.exercise)) continue;
    totals.set(it.exercise.primaryFocus, (totals.get(it.exercise.primaryFocus) ?? 0) + it.workSec);
  }
  let best: PrimaryFocus = items[0]?.exercise.primaryFocus ?? 'recovery';
  let bestSec = -1;
  for (const [focus, sec] of totals) {
    if (sec > bestSec) {
      best = focus;
      bestSec = sec;
    }
  }
  return best;
}
