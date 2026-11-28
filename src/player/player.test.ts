import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../domain/exercises';
import { generateWorkout, type WorkoutSession } from '../engine/generateWorkout';
import { seededRng } from '../engine/random';
import { currentImageKey, inStepCue, openingCue } from './cues';
import { initialPlayerState, playerReducer, type PlayerState } from './reducer';
import { buildTimeline } from './timeline';

const session = generateWorkout({ mood: 'strong', durationMin: 10, rng: seededRng(4) });
const timeline = buildTimeline(session);
const reduce = playerReducer(timeline);

describe('timeline', () => {
  it('covers exactly the session time', () => {
    expect(timeline.reduce((s, st) => s + st.durationSec, 0)).toBe(session.totalSec);
  });
  it('puts a form check before the first set of form-check moves', () => {
    const first = timeline.find((s) => s.kind === 'form-check');
    expect(first).toBeDefined();
    expect(session.items[first!.itemIndex].exercise.requiresFormCheck).toBe(true);
  });
});

describe('player reducer (hands-free)', () => {
  it('finishes the whole session from ticks alone, with no taps', () => {
    let state = initialPlayerState(timeline);
    let ticks = 0;
    while (state.status !== 'finished') {
      state = reduce(state, { type: 'tick' });
      ticks++;
    }
    expect(ticks).toBe(session.totalSec);
  });

  it('does not advance while paused', () => {
    const paused = reduce(initialPlayerState(timeline), { type: 'pause' });
    expect(reduce(paused, { type: 'tick' })).toEqual(paused);
  });

  it('marks a rest complete only when its timer expires naturally', () => {
    const restTimeline = [
      { kind: 'rest' as const, itemIndex: 0, durationSec: 1 },
      { kind: 'work' as const, itemIndex: 1, durationSec: 10 },
    ];
    const restReducer = playerReducer(restTimeline);
    const start = initialPlayerState(restTimeline);

    expect(restReducer(start, { type: 'tick' }).restCompletionVersion).toBe(1);
    expect(restReducer(start, { type: 'skip' }).restCompletionVersion).toBe(0);
  });

  it('skip jumps to the next move, past its rest', () => {
    const start = initialPlayerState(timeline);
    const skipped = reduce(start, { type: 'skip' });
    expect(timeline[skipped.stepIndex].itemIndex).toBe(1);
    expect(skipped.cueVersion).toBe(start.cueVersion + 1);
  });

  it('records items skipped before their work was done, but not skips from rest or a finished video', () => {
    let s = reduce(initialPlayerState(timeline), { type: 'skip' });
    expect(s.skippedItems).toEqual([0]);
    s = reduce(s, { type: 'skip', completed: true });
    expect(s.skippedItems).toEqual([0]);
    while (timeline[s.stepIndex].kind !== 'rest') s = reduce(s, { type: 'advance' });
    expect(reduce(s, { type: 'skip' }).skippedItems).toEqual([0]);
  });

  it('repeat bumps the cue version without moving', () => {
    const s: PlayerState = reduce(initialPlayerState(timeline), { type: 'repeat' });
    expect(s.stepIndex).toBe(0);
    expect(s.cueVersion).toBe(1);
  });
});

describe('voice cues', () => {
  it('announces the move with its intro on the first set', () => {
    const workIdx = timeline.findIndex((s) => s.kind === 'work');
    const item = session.items[timeline[workIdx].itemIndex];
    expect(openingCue(session, timeline, workIdx)).toContain(item.exercise.voiceIntro);
  });

  it('speaks each Chandra pose cue proportionally through its work duration', () => {
    const chandra = EXERCISES.find((exercise) => exercise.id === 'chandra-namaskar')!;
    const chandraSession: WorkoutSession = {
      ...session,
      items: [{ ...session.items[0], exercise: chandra, workSec: 80 }],
    };
    const chandraTimeline = buildTimeline(chandraSession);
    const chandraWorkIndex = chandraTimeline.findIndex((step) => step.kind === 'work');
    const steps = chandraSession.items[0].exercise.voiceSteps!;

    expect(openingCue(chandraSession, chandraTimeline, chandraWorkIndex)).toContain('Standing start.');
    steps.forEach(({ cue }, index) => {
      const cueElapsed = Math.round(((index + 1) * (80 - 10)) / steps.length);
      expect(inStepCue(chandraSession, chandraTimeline, chandraWorkIndex, 80 - cueElapsed)).toEqual({
        text: cue,
        droppable: false,
      });
    });
  });

  it('shows the image of the most recently announced pose, starting with the move image', () => {
    for (const id of ['chandra-namaskar', 'surya-namaskar']) {
      const flow = EXERCISES.find((exercise) => exercise.id === id)!;
      const flowSession: WorkoutSession = { ...session, items: [{ ...session.items[0], exercise: flow, workSec: 80 }] };
      const flowTimeline = buildTimeline(flowSession);
      const workIndex = flowTimeline.findIndex((step) => step.kind === 'work');
      const steps = flow.voiceSteps!;
      expect(currentImageKey(flowSession, flowTimeline, workIndex, 80)).toBe(flow.imageKey);
      steps.forEach(({ imageKey }, index) => {
        const cueElapsed = Math.round(((index + 1) * (80 - 10)) / steps.length);
        expect(currentImageKey(flowSession, flowTimeline, workIndex, 80 - cueElapsed)).toBe(imageKey);
        expect(currentImageKey(flowSession, flowTimeline, workIndex, 80 - cueElapsed - 1)).toBe(imageKey);
      });
    }
  });

  it('announces the side of a unilateral move and cues the switch', () => {
    const birdDog = EXERCISES.find((exercise) => exercise.id === 'bird-dog')!;
    const next = EXERCISES.find((exercise) => !exercise.unilateral && exercise.primaryFocus !== 'warmup')!;
    const sidedSession: WorkoutSession = {
      ...session,
      items: [
        { exercise: birdDog, side: 'right', round: 1, formCheckSec: 0, workSec: 20, restSec: 0 },
        { exercise: birdDog, side: 'left', round: 1, formCheckSec: 0, workSec: 20, restSec: 10 },
        { exercise: next, round: 1, formCheckSec: 0, workSec: 30, restSec: 0 },
      ],
    };
    const sidedTimeline = buildTimeline(sidedSession);
    expect(openingCue(sidedSession, sidedTimeline, 0)).toBe(`${birdDog.name}, right side. ${birdDog.voiceIntro}`);
    expect(inStepCue(sidedSession, sidedTimeline, 0, 5)).toEqual({ text: 'Next up: switch to your left side.', droppable: false });
    expect(openingCue(sidedSession, sidedTimeline, 1)).toBe(`Left side. ${birdDog.name}. Begin.`);
    expect(inStepCue(sidedSession, sidedTimeline, 2, 5)).toEqual({ text: `Next up: ${next.name}.`, droppable: false });
  });

  it('cues the next move 5 seconds before it starts and counts down work', () => {
    const restIdx = timeline.findIndex((s) => s.kind === 'rest');
    const next = session.items[timeline[restIdx].itemIndex + 1].exercise.name;
    expect(inStepCue(session, timeline, restIdx, 5)).toEqual({ text: `Next up: ${next}.`, droppable: false });
    const workIdx = timeline.findIndex((s) => s.kind === 'work');
    expect(inStepCue(session, timeline, workIdx, 3)).toEqual({ text: '3', droppable: true });
  });

  it('counts tempo for slow-tempo strength moves', () => {
    const idx = timeline.findIndex((s) => s.kind === 'work' && /^\d-\d-\d$/.test(session.items[s.itemIndex].exercise.tempo));
    const step = timeline[idx];
    const tempo = session.items[step.itemIndex].exercise.tempo.split('-').map(Number);
    const cycle = tempo[0] + tempo[1] + tempo[2];
    expect(inStepCue(session, timeline, idx, step.durationSec - cycle)?.text).toBe('Down');
    expect(inStepCue(session, timeline, idx, step.durationSec - cycle - 1)?.text).toBe(tempo[0] > 1 ? '2' : tempo[1] > 0 ? 'Hold' : 'Up');
  });
});
