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
      valid,
      null,
    ]);
    expect(lib.map((e) => e.id)).toEqual([valid.id]);
  });
});
