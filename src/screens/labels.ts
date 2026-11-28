import type { Mood, PrimaryFocus } from '../domain/types';

export const MOOD_LABELS: Record<Mood, { title: string; hint: string }> = {
  moody: { title: 'Moody', hint: 'Auto-pilot flow' },
  slow: { title: 'Slow & Grounded', hint: 'Mobility + slow strength' },
  fast: { title: 'Fast / Bonkers', hint: 'Walk-at-home cardio' },
  strong: { title: 'Strong & Focused', hint: 'Dumbbells, bands, trainer' },
  meditative: { title: 'Meditative', hint: 'Breath + restore' },
};

export const FOCUS_LABELS: Record<PrimaryFocus, string> = {
  'full-body-flow': 'full-body flow',
  'lower-body': 'lower body',
  'upper-body-back': 'upper body & back',
  cardio: 'cardio',
  recovery: 'recovery',
  warmup: 'warm-up',
};
