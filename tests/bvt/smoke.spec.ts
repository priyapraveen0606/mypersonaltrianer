import { expect, test } from '@playwright/test';
import { MOODS, expectTouchTargets, installStubs, openHome, startWorkout, timer } from '../support/app';

test.describe('BVT', { tag: '@bvt' }, () => {
  test.beforeEach(async ({ page }) => {
    await installStubs(page);
  });

  test('app shell is offline-capable (manifest + active service worker)', async ({ page }) => {
    await openHome(page);
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const manifest = await (await page.request.get(manifestHref!)).json();
    expect(manifest).toMatchObject({ name: 'My Personal Trainer', display: 'standalone', start_url: '/' });

    await expect
      .poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state))
      .toBe('activated');
  });

  test('home screen renders the 2-tap check-in', async ({ page }) => {
    await openHome(page);
    for (const mood of MOODS) await expect(page.getByRole('radio', { name: mood })).toBeVisible();
    for (const min of [10, 15, 30, 45]) await expect(page.getByRole('radio', { name: `${min} min` })).toBeVisible();

    const start = page.getByRole('button', { name: 'Start', exact: true });
    await expect(start).toBeDisabled();
    await page.getByRole('radio', { name: 'Fast / Bonkers' }).click();
    await expect(start).toBeDisabled();
    await page.getByRole('radio', { name: '10 min' }).click();
    await expect(start).toBeEnabled();
  });

  test('workout player starts and speaks the first cue', async ({ page }) => {
    await openHome(page);
    await startWorkout(page, 'Fast / Bonkers');
    await expect(page.getByText(/^Move 1 of \d+$/)).toBeVisible();
    await expect(timer(page)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(1);
  });

  test('wake lock is requested while playing and released on pause', async ({ page }) => {
    await openHome(page);
    await startWorkout(page, 'Fast / Bonkers');
    await expect.poll(() => page.evaluate(() => window.__wakeLock.requests)).toEqual(['screen']);

    await page.getByRole('button', { name: 'Pause' }).click();
    await expect.poll(() => page.evaluate(() => window.__wakeLock.releases)).toBe(1);

    await page.getByRole('button', { name: 'Play' }).click();
    await expect.poll(() => page.evaluate(() => window.__wakeLock.requests)).toEqual(['screen', 'screen']);
  });

  test('touch targets are at least 48x48 px on Home and Player', async ({ page }) => {
    await openHome(page);
    await expectTouchTargets(page);
    await expect.poll(() => page.locator('[role="radio"]').count()).toBe(9);
    await startWorkout(page, 'Strong & Focused');
    await expectTouchTargets(page);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expectTouchTargets(page);
  });
});
