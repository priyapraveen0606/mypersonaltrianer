import type { Step } from './timeline';

export type PlayerStatus = 'playing' | 'paused' | 'finished';

export interface PlayerState {
  stepIndex: number;
  remainingSec: number;
  status: PlayerStatus;
  muted: boolean;
  /** Increments whenever a new step starts or a cue should be re-spoken. */
  cueVersion: number;
}

export type PlayerAction =
  | { type: 'tick' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'skip' }
  | { type: 'advance' }
  | { type: 'repeat' }
  | { type: 'toggleMute' };

export function initialPlayerState(timeline: readonly Step[]): PlayerState {
  return {
    stepIndex: 0,
    remainingSec: timeline[0]?.durationSec ?? 0,
    status: timeline.length > 0 ? 'playing' : 'finished',
    muted: false,
    cueVersion: 0,
  };
}

function goTo(state: PlayerState, timeline: readonly Step[], stepIndex: number): PlayerState {
  if (stepIndex >= timeline.length) {
    return { ...state, stepIndex: timeline.length, remainingSec: 0, status: 'finished', cueVersion: state.cueVersion + 1 };
  }
  return { ...state, stepIndex, remainingSec: timeline[stepIndex].durationSec, cueVersion: state.cueVersion + 1 };
}

export function playerReducer(timeline: readonly Step[]) {
  return (state: PlayerState, action: PlayerAction): PlayerState => {
    if (state.status === 'finished') return state;
    switch (action.type) {
      case 'tick':
        if (state.status !== 'playing') return state;
        if (state.remainingSec > 1) return { ...state, remainingSec: state.remainingSec - 1 };
        return goTo(state, timeline, state.stepIndex + 1);
      case 'pause':
        return { ...state, status: 'paused' };
      case 'resume':
        return { ...state, status: 'playing' };
      case 'advance':
        return goTo(state, timeline, state.stepIndex + 1);
      case 'skip': {
        const current = timeline[state.stepIndex].itemIndex;
        let next = state.stepIndex + 1;
        while (next < timeline.length && timeline[next].itemIndex === current) next++;
        return goTo({ ...state, status: 'playing' }, timeline, next);
      }
      case 'repeat':
        return { ...state, cueVersion: state.cueVersion + 1 };
      case 'toggleMute':
        return { ...state, muted: !state.muted };
    }
  };
}
