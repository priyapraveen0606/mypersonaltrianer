import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { SessionItem, WorkoutSession } from '../engine/generateWorkout';
import { exerciseImageUrl } from '../domain/exercises';
import { parseWhitelistedVideo } from '../domain/video';
import { useWakeLock } from '../hooks/useWakeLock';
import { currentImageKey, inStepCue, openingCue } from '../player/cues';
import { initialPlayerState, playerReducer } from '../player/reducer';
import { buildTimeline } from '../player/timeline';
import { isSpeechSupported, speak, stopSpeaking } from '../voice/speech';
import { playRestEndSound } from '../voice/sound';
import { MOOD_LABELS } from './labels';

interface Props {
  session: WorkoutSession;
  onFinish: (skippedItems: number[]) => void;
  onQuit: () => void;
}

const controlBase =
  'min-h-16 min-w-16 flex-1 rounded-2xl px-3 text-xl font-bold focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-400';
// Exactly one colour set per button: combining Tailwind bg/text utilities lets CSS order pick the winner.
const control = `${controlBase} bg-slate-800 text-slate-50 active:bg-slate-700`;
const primary = `${controlBase} bg-emerald-400 text-slate-900 active:bg-emerald-300`;
const selected = `${controlBase} bg-amber-400 text-slate-900`;

const SIDE_TEXT = { right: 'Right side', left: 'Left side' } as const;
const nextLabel = (item: SessionItem | undefined) =>
  item ? `${item.exercise.name}${item.side ? ` (${item.side} side)` : ''}` : '';

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

export function PlayerScreen({ session, onFinish, onQuit }: Props) {
  const timeline = useMemo(() => buildTimeline(session), [session]);
  const reducer = useMemo(() => playerReducer(timeline), [timeline]);
  const [state, dispatch] = useReducer(reducer, timeline, initialPlayerState);
  const [videoStep, setVideoStep] = useState<number | null>(null);
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const { supported: wakeLockSupported } = useWakeLock(state.status === 'playing');
  const finishedRef = useRef(false);

  const step = timeline[state.stepIndex];
  const item = step ? session.items[step.itemIndex] : undefined;
  const video = item ? parseWhitelistedVideo(item.exercise.videoUrl) : null;
  // Video mode belongs to one step, so leaving that step (Skip, timer) always returns to voice.
  const videoMode = videoStep === state.stepIndex && video !== null && step?.kind === 'work';
  const setVideoMode = (on: boolean) => setVideoStep(on ? state.stepIndex : null);
  const ticking = state.status === 'playing' && !videoMode;
  const imageKey =
    step && (step.kind === 'work' || step.kind === 'form-check') && !videoMode
      ? currentImageKey(session, timeline, state.stepIndex, state.remainingSec)
      : undefined;

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    if (!ticking) return;
    const id = window.setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => window.clearInterval(id);
  }, [ticking]);

  useEffect(() => {
    if (state.status === 'finished' || state.muted || videoMode) return;
    speak(openingCue(session, timeline, state.stepIndex), { interrupt: true });
    // Only a new step (or Repeat) should trigger the opening cue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cueVersion]);

  useEffect(() => {
    if (state.status !== 'playing' || state.muted || videoMode || !step) return;
    const cue = inStepCue(session, timeline, state.stepIndex, state.remainingSec);
    if (cue) speak(cue.text, { dropIfBusy: cue.droppable });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.remainingSec]);

  useEffect(() => {
    if (state.status === 'paused' || state.muted || videoMode) stopSpeaking();
  }, [state.status, state.muted, videoMode]);

  const restCompletionVersion = useRef(state.restCompletionVersion);
  useEffect(() => {
    if (state.restCompletionVersion !== restCompletionVersion.current && !state.muted) {
      playRestEndSound();
    }
    restCompletionVersion.current = state.restCompletionVersion;
  }, [state.restCompletionVersion, state.muted]);

  useEffect(() => {
    if (state.status === 'finished' && !finishedRef.current) {
      finishedRef.current = true;
      if (!state.muted) speak('Workout complete. Beautiful work.', { interrupt: true });
      onFinish(state.skippedItems);
    }
  }, [state.status, state.muted, state.skippedItems, onFinish]);

  useEffect(() => () => stopSpeaking(), []);

  if (!step || !item) return null;

  const leaveVideo = () => {
    setVideoMode(false);
    dispatch({ type: 'skip', completed: true });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-5 p-5">
      <header className="flex items-baseline justify-between text-lg text-slate-300">
        <span>{MOOD_LABELS[session.mood].title} · {session.durationMin} min</span>
        <span>Move {step.itemIndex + 1} of {session.items.length}</span>
      </header>

      <section aria-live="polite" className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold uppercase tracking-wide text-sky-300">
          {step.kind === 'form-check' ? 'Form check' : step.kind === 'rest' ? 'Rest' : item.round > 1 ? `Round ${item.round}` : 'Now'}
        </p>
        {imageKey && (
          <img
            src={exerciseImageUrl(imageKey)}
            alt={`${imageKey.replace(/-/g, ' ')} illustration`}
            width={160}
            height={160}
            className="h-40 w-40 rounded-2xl bg-slate-800"
          />
        )}
        <h1 className="text-4xl font-extrabold">{item.exercise.name}</h1>
        {item.side && <p className="text-2xl font-bold text-amber-300">{SIDE_TEXT[item.side]}</p>}

        {step.kind === 'form-check' && (
          <div className="w-full rounded-2xl bg-slate-800 p-5 text-2xl leading-snug">
            <p>{item.exercise.formCue}</p>
            <button type="button" className={`${primary} mt-4 w-full`} onClick={() => dispatch({ type: 'advance' })}>
              Got it, start
            </button>
          </div>
        )}

        {step.kind === 'rest' && timeline[state.stepIndex + 1] && (
          <p className="text-2xl text-slate-300">Next: {nextLabel(session.items[step.itemIndex + 1])}</p>
        )}

        {videoMode && video ? (
          <div className="w-full">
            <div className="aspect-video w-full overflow-hidden rounded-2xl">
              <iframe
                title={`${item.exercise.name} video`}
                src={video.embedUrl}
                className="h-full w-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                // No allow-top-navigation / allow-forms: the embed can play, but never redirect the app.
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            </div>
            <button type="button" className={`${primary} mt-4 w-full`} onClick={leaveVideo}>
              Done with video
            </button>
          </div>
        ) : (
          <p className="font-mono text-8xl font-black tabular-nums" aria-label={`${state.remainingSec} seconds left`}>
            {fmt(state.remainingSec)}
          </p>
        )}

        {video && step.kind === 'work' && (
          <div role="radiogroup" aria-label="Guide" className="flex w-full gap-2">
            <button type="button" role="radio" aria-checked={!videoMode} className={!videoMode ? selected : control} onClick={() => setVideoMode(false)}>
              Voice Guide
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={videoMode}
              disabled={!online}
              className={`${videoMode ? selected : control} disabled:opacity-50`}
              onClick={() => setVideoMode(true)}
            >
              {online ? 'Play My Video' : 'Video needs internet'}
            </button>
          </div>
        )}
      </section>

      {(!isSpeechSupported() || !wakeLockSupported) && (
        <p className="text-center text-base text-amber-300">
          {!isSpeechSupported() ? 'Voice coaching is not supported in this browser. ' : ''}
          {!wakeLockSupported ? 'Keep the screen on manually — wake lock unavailable.' : ''}
        </p>
      )}

      <nav className="flex gap-3" aria-label="Player controls">
        {state.status === 'playing' ? (
          <button type="button" className={control} onClick={() => dispatch({ type: 'pause' })}>Pause</button>
        ) : (
          <button type="button" className={primary} onClick={() => dispatch({ type: 'resume' })}>Play</button>
        )}
        <button type="button" className={control} onClick={() => dispatch({ type: 'skip' })}>Skip</button>
        <button type="button" className={control} onClick={() => dispatch({ type: 'repeat' })}>Repeat</button>
        <button type="button" className={control} aria-pressed={state.muted} onClick={() => dispatch({ type: 'toggleMute' })}>
          {state.muted ? 'Unmute' : 'Mute'}
        </button>
      </nav>
      {state.status === 'paused' && (
        <button type="button" className={`${controlBase} w-full flex-none bg-transparent text-slate-300 underline`} onClick={onQuit}>
          End workout (not saved)
        </button>
      )}
    </main>
  );
}
