let audioContext: AudioContext | null = null;

export function unlockRestEndSound(): void {
  if (typeof window === 'undefined' || !window.AudioContext) return;
  if (audioContext) return;
  try {
    audioContext = new window.AudioContext();
    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch((error: unknown) => {
        console.warn('Rest chime is unavailable', error);
      });
    }
  } catch (error) {
    console.warn('Rest chime is unavailable', error);
  }
}

export function playRestEndSound(): void {
  if (!audioContext || audioContext.state !== 'running') return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.31);
}
