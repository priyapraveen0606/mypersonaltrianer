import { describe, expect, it } from 'vitest';
import { generateWorkout } from '../engine/generateWorkout';
import { seededRng } from '../engine/random';
import { inStepCue, openingCue } from './cues';
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

  it('skip jumps to the next move, past its rest', () => {
    const start = initialPlayerState(timeline);
    const skipped = reduce(start, { type: 'skip' });
    expect(timeline[skipped.stepIndex].itemIndex).toBe(1);
    expect(skipped.cueVersion).toBe(start.cueVersion + 1);
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

  it('cues the next move 5 seconds before it starts and counts down work', () => {
    const restIdx = timeline.findIndex((s) => s.kind === 'rest');
    const next = session.items[timeline[restIdx].itemIndex + 1].exercise.name;
    expect(inStepCue(session, timeline, restIdx, 5)).toBe(`Next up: ${next}.`);
    const workIdx = timeline.findIndex((s) => s.kind === 'work');
    expect(inStepCue(session, timeline, workIdx, 3)).toBe('3');
  });

  it('counts tempo for slow-tempo strength moves', () => {
    const idx = timeline.findIndex((s) => s.kind === 'work' && /^\d-\d-\d$/.test(session.items[s.itemIndex].exercise.tempo));
    const step = timeline[idx];
    const tempo = session.items[step.itemIndex].exercise.tempo.split('-').map(Number);
    const cycle = tempo[0] + tempo[1] + tempo[2];
    expect(inStepCue(session, timeline, idx, step.durationSec - cycle)).toBe('Down');
    expect(inStepCue(session, timeline, idx, step.durationSec - cycle - 1)).toBe(tempo[0] > 1 ? '2' : tempo[1] > 0 ? 'Hold' : 'Up');
  });
});
