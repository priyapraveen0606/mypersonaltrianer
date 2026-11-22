import { afterEach, describe, expect, it, vi } from 'vitest';
import { playRestEndSound, unlockRestEndSound } from './sound';

afterEach(() => vi.unstubAllGlobals());

describe('rest-end sound', () => {
  it('plays a short synthesized tone through Web Audio', () => {
    const oscillator = {
      type: '',
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
    const gain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
    class FakeAudioContext {
      state = 'running';
      currentTime = 2;
      destination = {};
      createOscillator = vi.fn(() => oscillator);
      createGain = vi.fn(() => gain);
    }
    vi.stubGlobal('AudioContext', FakeAudioContext);

    unlockRestEndSound();
    playRestEndSound();

    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 2);
    expect(oscillator.start).toHaveBeenCalledWith(2);
    expect(oscillator.stop).toHaveBeenCalledWith(2.31);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledTimes(2);
  });
});
