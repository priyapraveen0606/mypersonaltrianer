export const MOODS = ['moody', 'slow', 'fast', 'strong', 'meditative'] as const;
export type Mood = (typeof MOODS)[number];

export const DURATIONS_MIN = [10, 15, 30, 45] as const;
export type DurationMin = (typeof DURATIONS_MIN)[number];

export const EQUIPMENT = ['bodyweight', 'resistance-band', 'thigh-trainer', '1kg-dumbbell'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const PRIMARY_FOCUSES = [
  'full-body-flow',
  'lower-body',
  'upper-body-back',
  'cardio',
  'recovery',
] as const;
export type PrimaryFocus = (typeof PRIMARY_FOCUSES)[number];

export const POSITIONS = [
  'standing',
  'standing-flow',
  'seated',
  'supine',
  'prone',
  'quadruped',
  'side-lying',
] as const;
export type Position = (typeof POSITIONS)[number];

export interface Exercise {
  id: string;
  name: string;
  moods: Mood[];
  equipment: Equipment[];
  primaryFocus: PrimaryFocus;
  targetMuscle: string;
  position: Position;
  itBandSafe: boolean;
  requiresFormCheck: boolean;
  formCue: string;
  defaultDurationSec: number;
  defaultRestSec: number;
  tempo: string;
  voiceIntro: string;
  videoUrl?: string;
}

export const RATINGS = ['easy', 'just-right', 'too-hard'] as const;
export type Rating = (typeof RATINGS)[number];
