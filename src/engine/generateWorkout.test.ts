import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../domain/exercises';
import { DURATIONS_MIN, MOODS, type Exercise, type PrimaryFocus } from '../domain/types';
import { generateWorkout, TIME_TOLERANCE_SEC, type WorkoutSession } from './generateWorkout';
import { seededRng } from './random';

const RECENT: (PrimaryFocus | null)[] = [null, 'lower-body', 'upper-body-back', 'cardio', 'full-body-flow'];

/** 100+ randomized generations across every mood × duration × recent focus. */
function randomizedSessions(count = 200): WorkoutSession[] {
  const pick = seededRng(42);
  return Array.from({ length: count }, (_, i) =>
    generateWorkout({
      mood: MOODS[Math.floor(pick() * MOODS.length)],
      durationMin: DURATIONS_MIN[Math.floor(pick() * DURATIONS_MIN.length)],
      recentFocus: RECENT[Math.floor(pick() * RECENT.length)],
      rng: seededRng(i),
    }),
  );
}

const everyCombination = (): WorkoutSession[] =>
  MOODS.flatMap((mood) =>
    DURATIONS_MIN.flatMap((durationMin) =>
      RECENT.map((recentFocus) => generateWorkout({ mood, durationMin, recentFocus, rng: seededRng(7) })),
    ),
  );

const sessions = [...randomizedSessions(), ...everyCombination()];
const hasThighTrainer = (s: WorkoutSession) => s.items.some((it) => it.exercise.equipment.includes('thigh-trainer'));

describe('CONSTRAINTS §4 acceptance guarantees', () => {
  it('1. never returns a side-lying or IT-band-unsafe exercise', () => {
    for (const s of sessions) {
      for (const it of s.items) {
        expect(it.exercise.position).not.toBe('side-lying');
        expect(it.exercise.itBandSafe).toBe(true);
      }
    }
  });

  it('2. every session with the thigh-trainer also has a banded glute-medius move', () => {
    const withTrainer = sessions.filter(hasThighTrainer);
    expect(withTrainer.length).toBeGreaterThan(0);
    for (const s of withTrainer) {
      expect(
        s.items.some((it) => it.exercise.equipment.includes('resistance-band') && it.exercise.targetMuscle === 'glute-medius'),
      ).toBe(true);
    }
  });

  it('3. total time is within ±60 s of the requested 10/15/30/45 minutes', () => {
    for (const s of sessions) {
      const total = s.items.reduce((sum, it) => sum + it.formCheckSec + it.workSec + it.restSec, 0);
      expect(total).toBe(s.totalSec);
      expect(Math.abs(total - s.durationMin * 60)).toBeLessThanOrEqual(TIME_TOLERANCE_SEC);
    }
  });

  it('4. a lower-body session yesterday prevents a lower-body session today', () => {
    for (const mood of ['slow', 'strong', 'fast'] as const) {
      for (const durationMin of DURATIONS_MIN) {
        for (let seed = 0; seed < 10; seed++) {
          const s = generateWorkout({ mood, durationMin, recentFocus: 'lower-body', rng: seededRng(seed) });
          expect(s.primaryFocus).not.toBe('lower-body');
          expect(s.items.filter((it) => it.exercise.primaryFocus === 'lower-body')).toEqual([]);
        }
      }
    }
  });
});

describe('workout generation', () => {
  it('only uses exercises from the vetted library that match the mood', () => {
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const s of sessions) {
      for (const it of s.items) {
        expect(ids.has(it.exercise.id)).toBe(true);
        const isAutoBalancePartner = it.exercise.targetMuscle === 'glute-medius';
        if (!isAutoBalancePartner) expect(it.exercise.moods).toContain(s.mood);
      }
    }
  });

  it('Moody is not beginner: 15 min is mostly consecutive Sun/Moon Salutation rounds', () => {
    const s = generateWorkout({ mood: 'moody', durationMin: 15, rng: seededRng(1) });
    const flows = s.items.filter((it) => it.exercise.primaryFocus === 'full-body-flow');
    expect(flows.length).toBeGreaterThanOrEqual(8);
    expect(s.items.at(-1)?.exercise.id).toBe('box-breathing-cooldown');
    const ids = flows.map((it) => it.exercise.id);
    const switches = ids.filter((id, i) => i > 0 && id !== ids[i - 1]).length;
    expect(switches).toBeLessThanOrEqual(1);
    expect(flows.at(-1)?.round).toBeGreaterThan(1);
  });

  it('Moody and Meditative ignore yesterday’s memory', () => {
    const base = generateWorkout({ mood: 'meditative', durationMin: 30, rng: seededRng(3) });
    const after = generateWorkout({ mood: 'meditative', durationMin: 30, recentFocus: 'lower-body', rng: seededRng(3) });
    expect(after.items.map((it) => it.exercise.id)).toEqual(base.items.map((it) => it.exercise.id));
  });

  it('shows a form check only before the first set of a form-check exercise', () => {
    for (const s of sessions) {
      const seen = new Set<string>();
      for (const it of s.items) {
        const expected = it.exercise.requiresFormCheck && !seen.has(it.exercise.id) ? 5 : 0;
        expect(it.formCheckSec).toBe(expected);
        seen.add(it.exercise.id);
      }
    }
  });

  it('ends without trailing rest and is reproducible for a given seed', () => {
    const a = generateWorkout({ mood: 'strong', durationMin: 30, rng: seededRng(9) });
    const b = generateWorkout({ mood: 'strong', durationMin: 30, rng: seededRng(9) });
    expect(a.items.at(-1)?.restSec).toBe(0);
    expect(a).toEqual(b);
  });

  it('drops thigh-trainer moves when no banded glute-medius partner exists', () => {
    const library = EXERCISES.filter((e) => !(e.equipment.includes('resistance-band') && e.targetMuscle === 'glute-medius'));
    const s = generateWorkout({ mood: 'strong', durationMin: 30, library, rng: seededRng(2) });
    expect(s.items.some((it) => it.exercise.equipment.includes('thigh-trainer'))).toBe(false);
  });

  it('rejects unsafe entries even if passed in directly', () => {
    const unsafe: Exercise = { ...EXERCISES[0], id: 'side-clam', position: 'side-lying', moods: ['moody'] };
    for (let seed = 0; seed < 20; seed++) {
      const s = generateWorkout({ mood: 'moody', durationMin: 10, library: [unsafe, ...EXERCISES], rng: seededRng(seed) });
      expect(s.items.some((it) => it.exercise.id === 'side-clam')).toBe(false);
    }
  });
});
