import type { WorkoutSession } from '../engine/generateWorkout';
import type { Step } from './timeline';

export const NEXT_UP_LEAD_SEC = 5;

function nextWorkItem(timeline: readonly Step[], stepIndex: number): number | null {
  const current = timeline[stepIndex].itemIndex;
  for (let i = stepIndex + 1; i < timeline.length; i++) {
    if (timeline[i].itemIndex !== current) return timeline[i].itemIndex;
  }
  return null;
}

/** Spoken when a step begins (and on Repeat). */
export function openingCue(session: WorkoutSession, timeline: readonly Step[], stepIndex: number): string {
  const step = timeline[stepIndex];
  const item = session.items[step.itemIndex];
  const { exercise } = item;
  switch (step.kind) {
    case 'form-check':
      return `Form check: ${exercise.name}. ${exercise.formCue}`;
    case 'work':
      return item.round === 1
        ? `${exercise.name}. ${exercise.voiceIntro}`
        : `Round ${item.round}. ${exercise.name}. Begin.`;
    case 'rest':
      return `Rest for ${step.durationSec} seconds.`;
  }
}

function tempoPhrase(tempo: string, elapsed: number): string | null {
  const m = /^(\d+)-(\d+)-(\d+)$/.exec(tempo);
  if (!m) return null;
  const phases: [string, number][] = [
    ['Down', +m[1]],
    ['Hold', +m[2]],
    ['Up', +m[3]],
  ];
  const cycle = phases.reduce((s, [, n]) => s + n, 0);
  if (cycle === 0) return null;
  let t = elapsed % cycle;
  for (const [label, n] of phases) {
    if (t < n) return t === 0 ? label : String(t + 1);
    t -= n;
  }
  return null;
}

const BOX_BREATH = ['Breathe in', 'Hold', 'Breathe out', 'Hold'];

/** Cue for a second inside the current step (excluding the opening cue), or null. */
export function inStepCue(
  session: WorkoutSession,
  timeline: readonly Step[],
  stepIndex: number,
  remainingSec: number,
): string | null {
  const step = timeline[stepIndex];
  const elapsed = step.durationSec - remainingSec;
  if (elapsed === 0) return null;
  const nextItem = nextWorkItem(timeline, stepIndex);
  const isLastStepOfItem = timeline[stepIndex + 1]?.itemIndex !== step.itemIndex;

  if (isLastStepOfItem && remainingSec === NEXT_UP_LEAD_SEC && nextItem !== null) {
    return `Next up: ${session.items[nextItem].exercise.name}.`;
  }
  if (step.kind !== 'work') return null;
  if (remainingSec <= 3) return String(remainingSec);

  const { tempo } = session.items[step.itemIndex].exercise;
  if (tempo === 'breath') return elapsed % 4 === 0 ? BOX_BREATH[(elapsed / 4) % 4] : null;
  if (tempo === 'isometric' || tempo === 'hold') return elapsed % 10 === 0 ? 'Hold. Keep breathing.' : null;
  if (tempo === 'flow' || tempo === 'fast') {
    return elapsed === Math.floor(step.durationSec / 2) ? (tempo === 'fast' ? 'Halfway. Keep moving!' : 'Halfway. Stay with your breath.') : null;
  }
  return tempoPhrase(tempo, elapsed);
}
