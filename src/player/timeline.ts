import type { WorkoutSession } from '../engine/generateWorkout';

export type StepKind = 'form-check' | 'work' | 'rest';

export interface Step {
  kind: StepKind;
  itemIndex: number;
  durationSec: number;
}

export function buildTimeline(session: WorkoutSession): Step[] {
  const steps: Step[] = [];
  session.items.forEach((item, itemIndex) => {
    if (item.formCheckSec > 0) steps.push({ kind: 'form-check', itemIndex, durationSec: item.formCheckSec });
    steps.push({ kind: 'work', itemIndex, durationSec: item.workSec });
    if (item.restSec > 0) steps.push({ kind: 'rest', itemIndex, durationSec: item.restSec });
  });
  return steps;
}
