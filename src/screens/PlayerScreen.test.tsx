import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXERCISES } from '../domain/exercises';
import type { WorkoutSession } from '../engine/generateWorkout';
import { PlayerScreen } from './PlayerScreen';

const { playRestEndSound } = vi.hoisted(() => ({ playRestEndSound: vi.fn() }));
vi.mock('../voice/sound', () => ({ playRestEndSound, unlockRestEndSound: vi.fn() }));

const byId = (id: string) => EXERCISES.find((e) => e.id === id)!;
const plain = EXERCISES.find((e) => !e.videoUrl && !e.requiresFormCheck)!;
const session: WorkoutSession = {
  mood: 'moody', durationMin: 10, targetSec: 600, totalSec: 100, primaryFocus: 'full-body-flow',
  items: [
    { exercise: byId('chandra-namaskar'), round: 1, formCheckSec: 0, workSec: 40, restSec: 10 },
    { exercise: plain, round: 1, formCheckSec: 0, workSec: 50, restSec: 0 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.stubGlobal('SpeechSynthesisUtterance', class { rate = 1; constructor(public text: string) {} });
  vi.stubGlobal('speechSynthesis', { speak: () => {}, cancel: () => {}, getVoices: () => [] });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const tick = (n: number) => {
  for (let i = 0; i < n; i++) act(() => void vi.advanceTimersByTime(1000));
};

describe('PlayerScreen video mode', () => {
  it('sandboxes the YouTube embed so it cannot navigate the app or open forms', () => {
    render(<PlayerScreen session={session} onFinish={() => {}} onQuit={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Play My Video' }));
    const frame = screen.getByTitle(/video/);
    expect(frame.getAttribute('sandbox')?.split(' ').sort()).toEqual(
      ['allow-popups', 'allow-presentation', 'allow-same-origin', 'allow-scripts'],
    );
    expect(frame).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  });

  it('returns to voice and keeps the timer running when Skip is pressed during a video', () => {
    render(<PlayerScreen session={session} onFinish={() => {}} onQuit={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Play My Video' }));
    expect(screen.getByTitle(/video/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByTitle(/video/)).not.toBeInTheDocument();
    expect(screen.getByText('0:50')).toBeInTheDocument();
    tick(2);
    expect(screen.getByText('0:48')).toBeInTheDocument();
  });

  it('reports skipped moves on finish, but not a move finished via its video', () => {
    const onFinish = vi.fn();
    render(<PlayerScreen session={session} onFinish={onFinish} onQuit={() => {}} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Play My Video' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done with video' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onFinish).toHaveBeenCalledWith([1]);
  });
});

describe('PlayerScreen rest sound', () => {
  it('plays a chime when a rest timer finishes naturally', () => {
    render(<PlayerScreen session={session} onFinish={() => {}} onQuit={() => {}} />);
    tick(40);
    tick(10);
    expect(playRestEndSound).toHaveBeenCalledOnce();
  });

  it('does not chime when the user skips a rest or has muted audio', () => {
    const { unmount } = render(<PlayerScreen session={session} onFinish={() => {}} onQuit={() => {}} />);
    tick(40);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(playRestEndSound).not.toHaveBeenCalled();
    unmount();

    render(<PlayerScreen session={session} onFinish={() => {}} onQuit={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    tick(40);
    tick(10);
    expect(playRestEndSound).not.toHaveBeenCalled();
  });
});
