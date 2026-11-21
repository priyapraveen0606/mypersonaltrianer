import { expect, type Page } from '@playwright/test';

export const MOODS = ['Moody', 'Slow & Grounded', 'Fast / Bonkers', 'Strong & Focused', 'Meditative'] as const;
export type MoodTitle = (typeof MOODS)[number];

declare global {
  interface Window {
    __wakeLock: { requests: string[]; releases: number };
    __spoken: string[];
  }
}

/**
 * Makes runs reproducible and observable: seeds Math.random (the workout engine's default RNG),
 * and replaces Screen Wake Lock and speech synthesis with recording stubs.
 */
export async function installStubs(page: Page, seed = 42): Promise<void> {
  await page.addInitScript((initialSeed: number) => {
    let a = initialSeed >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    window.__wakeLock = { requests: [], releases: 0 };
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: async (type: string) => {
          window.__wakeLock.requests.push(type);
          const sentinel = new EventTarget() as EventTarget & { released: boolean; type: string; release: () => Promise<void> };
          sentinel.released = false;
          sentinel.type = type;
          sentinel.release = async () => {
            if (sentinel.released) return;
            sentinel.released = true;
            window.__wakeLock.releases++;
          };
          return sentinel;
        },
      },
    });

    window.__spoken = [];
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        pending: false,
        paused: false,
        getVoices: () => [],
        speak: (u: SpeechSynthesisUtterance) => window.__spoken.push(u.text),
        cancel: () => {},
        pause: () => {},
        resume: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  }, seed);
}

export async function openHome(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'How are you feeling?' })).toBeVisible();
}

export async function startWorkout(page: Page, mood: MoodTitle, minutes: 10 | 15 | 30 | 45 = 10): Promise<void> {
  await page.getByRole('radio', { name: mood }).click();
  await page.getByRole('radio', { name: `${minutes} min` }).click();
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Player controls' })).toBeVisible();
}

export const stepLabel = (page: Page) => page.locator('main section[aria-live] > p').first();
export const timer = (page: Page) => page.getByLabel(/seconds left$/);

/** Skips forward until the form-check card is showing. */
export async function skipToFormCheck(page: Page, maxSkips = 20): Promise<void> {
  for (let i = 0; i < maxSkips; i++) {
    if ((await stepLabel(page).textContent()) === 'Form check') return;
    await page.getByRole('button', { name: 'Skip' }).click();
  }
  throw new Error(`No form-check card within ${maxSkips} skips`);
}

/** Skips every remaining move until the pulse check appears. */
export async function skipToEnd(page: Page, maxSkips = 60): Promise<void> {
  const pulse = page.getByRole('heading', { name: 'How did that feel?' });
  const skip = page.getByRole('button', { name: 'Skip' });
  for (let i = 0; i < maxSkips; i++) {
    // The last Skip unmounts the player before the pulse check renders; wait for either.
    await expect(skip.or(pulse).first()).toBeVisible();
    if (await pulse.isVisible()) return;
    await skip.click();
  }
  await expect(pulse).toBeVisible();
}

/** Asserts every visible button meets the 48x48 px touch-target minimum (CONSTRAINTS §3). */
export async function expectTouchTargets(page: Page, min = 48): Promise<void> {
  const buttons = page.getByRole('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    if (!(await button.isVisible())) continue;
    const box = await button.boundingBox();
    const name = (await button.textContent())?.trim();
    expect(box, `bounding box for "${name}"`).not.toBeNull();
    expect.soft(box!.width, `"${name}" width`).toBeGreaterThanOrEqual(min);
    expect.soft(box!.height, `"${name}" height`).toBeGreaterThanOrEqual(min);
  }
}

export async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
    }
  });
}
