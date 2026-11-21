import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { installStubs, openHome, skipToEnd, skipToFormCheck, startWorkout } from './support/app';

const BLOCKING = new Set(['serious', 'critical']);

async function expectNoBlockingViolations(page: Page): Promise<void> {
  // Colour transitions mid-flight would make color-contrast measure an in-between colour.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const blocking = violations
    .filter((v) => BLOCKING.has(v.impact ?? ''))
    .map((v) => `${v.impact}: ${v.id} — ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  expect(blocking, 'serious/critical axe violations').toEqual([]);
}

test.describe('Accessibility (axe-core)', { tag: '@a11y' }, () => {
  test.beforeEach(async ({ page }) => {
    await installStubs(page);
    await openHome(page);
  });

  test('home', async ({ page }) => {
    await expectNoBlockingViolations(page);
    await page.getByRole('radio', { name: 'Moody' }).click();
    await page.getByRole('radio', { name: '15 min' }).click();
    await expectNoBlockingViolations(page);
  });

  test('workout player (playing and paused)', async ({ page }) => {
    await startWorkout(page, 'Fast / Bonkers');
    await expectNoBlockingViolations(page);
    await page.getByRole('button', { name: 'Pause' }).click();
    await expectNoBlockingViolations(page);
  });

  test('form-check card', async ({ page }) => {
    await startWorkout(page, 'Strong & Focused');
    await skipToFormCheck(page);
    await expectNoBlockingViolations(page);
  });

  test('pulse check and Afterglow', async ({ page }) => {
    await startWorkout(page, 'Fast / Bonkers');
    await skipToEnd(page);
    await expectNoBlockingViolations(page);
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.getByRole('heading', { name: 'Afterglow' })).toBeVisible();
    await expectNoBlockingViolations(page);
  });
});
