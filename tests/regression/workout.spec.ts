import { expect, test } from '@playwright/test';
import { installStubs, openHome, skipToFormCheck, startWorkout, stepLabel, timer, waitForServiceWorkerControl } from '../support/app';

test.describe('Regression', { tag: '@regression' }, () => {
  test.beforeEach(async ({ page }) => {
    await installStubs(page);
  });

  test('full session: timer runs to completion, pulse check, Afterglow, back home', async ({ page }) => {
    await page.clock.install();
    await openHome(page);
    await startWorkout(page, 'Fast / Bonkers');

    const pulse = page.getByRole('heading', { name: 'How did that feel?' });
    // 10-minute session must finish within the ±60 s engine tolerance.
    for (let elapsed = 0; elapsed < 11 * 60 && !(await pulse.isVisible()); elapsed += 30) {
      await page.clock.runFor(30_000);
    }
    await expect(pulse).toBeVisible();
    expect(await page.evaluate(() => window.__spoken)).toContain('Workout complete. Beautiful work.');

    await page.getByRole('button', { name: 'Just Right' }).click();
    await expect(page.getByRole('heading', { name: 'Afterglow' })).toBeVisible();
    await expect(page.getByRole('definition').last()).toHaveText('1');

    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByText('1-day streak. Lovely to see you.')).toBeVisible();

    const log = await page.evaluate(() => Object.values(localStorage).join(''));
    expect(log).toContain('"rating":"just-right"');
  });

  test('pause freezes the timer and resume continues it', async ({ page }) => {
    await page.clock.install();
    await openHome(page);
    await startWorkout(page, 'Fast / Bonkers');

    await page.clock.runFor(2_000);
    await page.getByRole('button', { name: 'Pause' }).click();
    const pausedAt = await timer(page).getAttribute('aria-label');
    await expect(page.getByRole('button', { name: 'End workout (not saved)' })).toBeVisible();

    await page.clock.runFor(5_000);
    await expect(timer(page)).toHaveAttribute('aria-label', pausedAt!);

    await page.getByRole('button', { name: 'Play' }).click();
    await page.clock.runFor(3_000);
    const pausedSec = Number(pausedAt!.split(' ')[0]);
    await expect(timer(page)).toHaveAttribute('aria-label', `${pausedSec - 3} seconds left`);
    await expect(page.getByRole('button', { name: 'End workout (not saved)' })).toBeHidden();
  });

  test('ending a paused workout returns home without saving', async ({ page }) => {
    await openHome(page);
    await startWorkout(page, 'Fast / Bonkers');
    await page.getByRole('button', { name: 'Pause' }).click();
    await page.getByRole('button', { name: 'End workout (not saved)' }).click();
    await expect(page.getByRole('heading', { name: 'How are you feeling?' })).toBeVisible();
    expect(await page.evaluate(() => Object.values(localStorage).join(''))).not.toContain('completedAt');
  });

  test('form-check card shows the cue and hands over to the move', async ({ page }) => {
    await openHome(page);
    await startWorkout(page, 'Strong & Focused');
    await skipToFormCheck(page);

    const exercise = await page.getByRole('heading', { level: 1 }).textContent();
    const cue = page.locator('section[aria-live] div.rounded-2xl > p');
    await expect(cue).not.toBeEmpty();
    await expect(page.locator('iframe')).toHaveCount(0);

    await page.getByRole('button', { name: 'Got it, start' }).click();
    await expect(stepLabel(page)).toHaveText(/^(Now|Round \d+)$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(exercise!);
    await expect(page.getByRole('button', { name: 'Got it, start' })).toBeHidden();
  });

  test('reloads offline from the service worker and can still start a workout', async ({ page, context }) => {
    await openHome(page);
    await waitForServiceWorkerControl(page);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'How are you feeling?' })).toBeVisible();
    await startWorkout(page, 'Meditative');
    await expect(timer(page)).toBeVisible();
    await context.setOffline(false);
  });
});
