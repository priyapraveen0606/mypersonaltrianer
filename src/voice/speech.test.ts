import { afterEach, describe, expect, it, vi } from 'vitest';
import { speak } from './speech';

function stubSynth(speaking: boolean) {
  const spoken: string[] = [];
  vi.stubGlobal('SpeechSynthesisUtterance', class { rate = 1; constructor(public text: string) {} });
  vi.stubGlobal('speechSynthesis', { speaking, pending: false, speak: (u: { text: string }) => spoken.push(u.text), cancel: () => {}, getVoices: () => [] });
  return spoken;
}

afterEach(() => vi.unstubAllGlobals());

describe('speak', () => {
  it('drops a droppable cue while an earlier utterance is still playing', () => {
    const spoken = stubSynth(true);
    speak('2', { dropIfBusy: true });
    speak('Next up: Bridge.');
    expect(spoken).toEqual(['Next up: Bridge.']);
  });
  it('speaks a droppable cue when speech is idle', () => {
    const spoken = stubSynth(false);
    speak('Down', { dropIfBusy: true });
    expect(spoken).toEqual(['Down']);
  });
});
