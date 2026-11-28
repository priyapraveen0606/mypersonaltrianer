import rawExercises from '../data/exercises.json';
import {
  EQUIPMENT,
  MOODS,
  POSITIONS,
  PRIMARY_FOCUSES,
  type Exercise,
} from './types';
import { parseWhitelistedVideo } from './video';

export const MIN_EXERCISE_SEC = 10;
export const MAX_EXERCISE_SEC = 600;

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

const isSubsetOf = <T extends string>(allowed: readonly T[], v: unknown): v is T[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => (allowed as readonly unknown[]).includes(x));

/** Image keys are file names under public/images/exercises/, so only safe slug characters. */
export const isImageKey = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v);

export const exerciseImageUrl = (imageKey: string): string =>
  `${import.meta.env.BASE_URL}images/exercises/${imageKey}.svg`;

const isVoiceStep = (v: unknown): boolean =>
  typeof v === 'object' &&
  v !== null &&
  isNonEmptyString((v as Record<string, unknown>).cue) &&
  isImageKey((v as Record<string, unknown>).imageKey);

const isIntInRange = (v: unknown, min: number, max: number): v is number =>
  Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/** Returns a list of problems; an empty list means the entry is a valid Exercise. */
export function validateExercise(entry: unknown): string[] {
  if (typeof entry !== 'object' || entry === null) return ['not an object'];
  const e = entry as Record<string, unknown>;
  const errors: string[] = [];
  for (const key of ['id', 'name', 'targetMuscle', 'formCue', 'tempo', 'voiceIntro'] as const) {
    if (!isNonEmptyString(e[key])) errors.push(`${key} must be a non-empty string`);
  }
  if (!isSubsetOf(MOODS, e.moods)) errors.push('moods must be a non-empty list of known moods');
  if (!isSubsetOf(EQUIPMENT, e.equipment)) errors.push('equipment must be a non-empty list of known equipment');
  if (!(PRIMARY_FOCUSES as readonly unknown[]).includes(e.primaryFocus)) errors.push('unknown primaryFocus');
  if (!(POSITIONS as readonly unknown[]).includes(e.position)) errors.push('unknown position');
  if (typeof e.itBandSafe !== 'boolean') errors.push('itBandSafe must be boolean');
  if (typeof e.requiresFormCheck !== 'boolean') errors.push('requiresFormCheck must be boolean');
  if (!isIntInRange(e.defaultDurationSec, MIN_EXERCISE_SEC, MAX_EXERCISE_SEC)) errors.push('defaultDurationSec out of range');
  if (!isIntInRange(e.defaultRestSec, 0, 120)) errors.push('defaultRestSec out of range');
  if (
    e.voiceSteps !== undefined &&
    (!Array.isArray(e.voiceSteps) || e.voiceSteps.length === 0 || !e.voiceSteps.every(isVoiceStep))
  ) {
    errors.push('voiceSteps must be a non-empty list of { cue, imageKey } steps');
  }
  if (e.imageKey !== undefined && !isImageKey(e.imageKey)) errors.push('imageKey must be a lowercase slug');
  if (e.unilateral !== undefined && typeof e.unilateral !== 'boolean') errors.push('unilateral must be boolean');
  if (e.videoUrl !== undefined && parseWhitelistedVideo(e.videoUrl) === null) {
    errors.push('videoUrl must be a YouTube watch/youtu.be URL');
  }
  return errors;
}

/** Hard safety filter (CONSTRAINTS §1): never side-lying, never IT-band-unsafe. */
export const isSafe = (e: Exercise): boolean => e.position !== 'side-lying' && e.itBandSafe;

/**
 * Loads the vetted library. Invalid or unsafe entries are dropped (and reported in dev),
 * so a bad edit to exercises.json can never reach the workout engine.
 */
export function loadLibrary(entries: unknown[] = rawExercises): Exercise[] {
  const seen = new Set<string>();
  const library: Exercise[] = [];
  for (const entry of entries) {
    const errors = validateExercise(entry);
    const ex = entry as Exercise;
    if (errors.length > 0 || seen.has(ex.id) || !isSafe(ex)) {
      if (import.meta.env.DEV) console.warn('Rejected exercise', (entry as { id?: string })?.id, errors);
      continue;
    }
    seen.add(ex.id);
    library.push(ex);
  }
  return library;
}

export const EXERCISES: readonly Exercise[] = loadLibrary();
