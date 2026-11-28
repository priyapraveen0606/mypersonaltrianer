import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import rawExercises from '../data/exercises.json';
import { EXERCISES, loadLibrary, validateExercise } from './exercises';

const valid = rawExercises[0];

describe('exercises.json (vetted library)', () => {
  it('every entry passes schema validation', () => {
    for (const entry of rawExercises) {
      expect({ id: entry.id, errors: validateExercise(entry) }).toEqual({ id: entry.id, errors: [] });
    }
  });

  it('contains no side-lying or IT-band-unsafe exercises', () => {
    for (const entry of rawExercises) {
      expect(entry.position).not.toBe('side-lying');
      expect(entry.itBandSafe).toBe(true);
    }
  });

  it('has unique ids and loads every entry', () => {
    expect(new Set(rawExercises.map((e) => e.id)).size).toBe(rawExercises.length);
    expect(EXERCISES).toHaveLength(rawExercises.length);
  });

  it('every exercise and guided pose has a bundled local image', () => {
    for (const e of EXERCISES) {
      const keys = [e.imageKey, ...(e.voiceSteps ?? []).map((s) => s.imageKey)];
      expect({ id: e.id, hasImage: e.imageKey !== undefined }).toEqual({ id: e.id, hasImage: true });
      for (const key of keys) {
        expect(existsSync(resolve(__dirname, `../../public/images/exercises/${key}.svg`)), `${e.id}: ${key}`).toBe(true);
      }
    }
  });

  it('guides both salutations pose by pose and marks one-sided moves unilateral', () => {
    const byId = (id: string) => EXERCISES.find((e) => e.id === id)!;
    expect(byId('chandra-namaskar').voiceSteps).toHaveLength(14);
    expect(byId('surya-namaskar').voiceSteps?.length).toBeGreaterThanOrEqual(10);
    for (const id of ['bent-over-hip-extension', 'standing-banded-hip-abduction', 'bird-dog', 'supine-figure-four-stretch', 'lateral-wall-push']) {
      expect(byId(id).unilateral, id).toBe(true);
    }
  });

  it('gives every mood a warm-up and a cool-down', () => {
    for (const mood of ['moody', 'slow', 'fast', 'strong', 'meditative'] as const) {
      expect(EXERCISES.some((e) => e.primaryFocus === 'warmup' && e.moods.includes(mood)), mood).toBe(true);
      expect(EXERCISES.some((e) => e.primaryFocus === 'recovery' && e.moods.includes(mood)), mood).toBe(true);
    }
  });

  it('can satisfy the auto-balance rule: has a banded glute-medius move', () => {
    expect(
      EXERCISES.some((e) => e.equipment.includes('resistance-band') && e.targetMuscle === 'glute-medius'),
    ).toBe(true);
  });
});

describe('loadLibrary', () => {
  it('drops side-lying, IT-band-unsafe, malformed and duplicate entries', () => {
    const lib = loadLibrary([
      valid,
      { ...valid, id: 'side-clam', position: 'side-lying' },
      { ...valid, id: 'risky', itBandSafe: false },
      { ...valid, id: 'bad-mood', moods: ['angry'] },
      { ...valid, id: 'evil-video', videoUrl: 'javascript:alert(1)' },
      { ...valid, id: 'bad-image', imageKey: '../../evil' },
      { ...valid, id: 'old-steps', voiceSteps: ['Inhale'] },
      { ...valid, id: 'step-no-image', voiceSteps: [{ cue: 'Inhale' }] },
      { ...valid, id: 'bad-side', unilateral: 'yes' },
      valid,
      null,
    ]);
    expect(lib.map((e) => e.id)).toEqual([valid.id]);
  });
});
