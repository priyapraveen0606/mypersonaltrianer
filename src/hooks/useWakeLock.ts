import { useEffect, useState } from 'react';

/** Holds a screen wake lock while `active`; re-acquires it when the tab becomes visible again. */
export function useWakeLock(active: boolean): { supported: boolean } {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  const [, setHeld] = useState(false);

  useEffect(() => {
    if (!supported || !active) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          await s.release();
          return;
        }
        sentinel = s;
        setHeld(true);
      } catch {
        setHeld(false);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
      setHeld(false);
    };
  }, [active, supported]);

  return { supported };
}
