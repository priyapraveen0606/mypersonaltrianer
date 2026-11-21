import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { loadSessions } from './storage/sessionLog';

const spoken: string[] = [];

beforeEach(() => {
  spoken.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 21, 8, 0));
  class Utterance {
    rate = 1;
    voice: unknown = null;
    constructor(public text: string) {}
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  vi.stubGlobal('speechSynthesis', {
    speak: (u: Utterance) => spoken.push(u.text),
    cancel: () => {},
    getVoices: () => [],
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('2-tap check-in', () => {
  it('keeps Start disabled until mood and time are both chosen', () => {
    render(<App />);
    const start = screen.getByRole('button', { name: 'Start' });
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: /Moody/ }));
    expect(start).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: '15 min' }));
    expect(start).toBeEnabled();
  });
});

describe('hands-free session', () => {
  it('runs a 15-min Moody session to the end with voice cues and no taps, then logs the rating', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: /Moody/ }));
    fireEvent.click(screen.getByRole('radio', { name: '15 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByRole('navigation', { name: 'Player controls' })).toBeInTheDocument();
    for (let s = 0; s < 15 * 60 + 2; s++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }

    expect(spoken.some((t) => t.includes('Namaskar'))).toBe(true);
    expect(spoken.some((t) => t.startsWith('Next up:'))).toBe(true);
    expect(spoken.at(-1)).toBe('Workout complete. Beautiful work.');
    expect(screen.getByRole('heading', { name: 'How did that feel?' })).toBeInTheDocument();
    expect(loadSessions()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Just Right' }));
    expect(loadSessions()[0]).toMatchObject({ mood: 'moody', durationMin: 15, rating: 'just-right', date: '2026-11-21' });
    expect(screen.getByText('Day streak').nextSibling).toHaveTextContent('1');
  });
});
