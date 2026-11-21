import { useCallback, useState } from 'react';
import { afterglowStats } from './domain/afterglow';
import { toLocalDate } from './domain/dates';
import type { DurationMin, Mood, Rating } from './domain/types';
import { generateWorkout, type WorkoutSession } from './engine/generateWorkout';
import { recentFocus } from './engine/memory';
import { AfterglowScreen } from './screens/AfterglowScreen';
import { HomeScreen } from './screens/HomeScreen';
import { PlayerScreen } from './screens/PlayerScreen';
import { PulseCheckScreen } from './screens/PulseCheckScreen';
import { appendSession, loadSessions, rateSession } from './storage/sessionLog';
import { speak } from './voice/speech';

type Screen =
  | { name: 'home' }
  | { name: 'player'; session: WorkoutSession }
  | { name: 'pulse'; completedAt: number }
  | { name: 'afterglow' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const today = toLocalDate(new Date());
  const sessions = loadSessions();

  const start = (mood: Mood, durationMin: DurationMin) => {
    const session = generateWorkout({ mood, durationMin, recentFocus: recentFocus(sessions, today) });
    // Speaking inside the tap handler unlocks speech synthesis on iOS Safari.
    speak("Let's begin.", { interrupt: true });
    setScreen({ name: 'player', session });
  };

  const finish = useCallback((session: WorkoutSession) => {
    const now = new Date();
    const completedAt = now.getTime();
    appendSession({
      date: toLocalDate(now),
      completedAt,
      mood: session.mood,
      durationMin: session.durationMin,
      primaryFocus: session.primaryFocus,
      exercisesCompleted: [...new Set(session.items.map((it) => it.exercise.id))],
      rating: null,
    });
    setScreen({ name: 'pulse', completedAt });
  }, []);

  const rate = (completedAt: number, rating: Rating) => {
    rateSession(completedAt, rating);
    setScreen({ name: 'afterglow' });
  };

  switch (screen.name) {
    case 'home':
      return <HomeScreen recentFocus={recentFocus(sessions, today)} stats={afterglowStats(sessions, today)} onStart={start} />;
    case 'player':
      return <PlayerScreen session={screen.session} onFinish={() => finish(screen.session)} onQuit={() => setScreen({ name: 'home' })} />;
    case 'pulse':
      return <PulseCheckScreen onRate={(r) => rate(screen.completedAt, r)} />;
    case 'afterglow':
      return <AfterglowScreen stats={afterglowStats(sessions, today)} onDone={() => setScreen({ name: 'home' })} />;
  }
}
