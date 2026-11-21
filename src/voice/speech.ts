export const DEFAULT_RATE = 0.95;

const synth = (): SpeechSynthesis | null =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

export const isSpeechSupported = (): boolean => synth() !== null;

function pickVoice(s: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = s.getVoices();
  return voices.find((v) => v.lang.startsWith('en') && v.localService) ?? voices.find((v) => v.lang.startsWith('en'));
}

/** Speaks `text`. `interrupt` cancels anything queued (step openings); `dropIfBusy` skips it if speech is busy. */
export function speak(text: string, { interrupt = false, dropIfBusy = false, rate = DEFAULT_RATE } = {}): void {
  const s = synth();
  if (!s) return;
  if (dropIfBusy && (s.speaking || s.pending)) return;
  if (interrupt) s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate;
  const voice = pickVoice(s);
  if (voice) u.voice = voice;
  s.speak(u);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
