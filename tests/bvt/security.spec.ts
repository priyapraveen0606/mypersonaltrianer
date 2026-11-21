import { expect, test, type Page } from '@playwright/test';
import { installStubs, openHome, startWorkout } from '../support/app';

const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';

async function recordCspViolations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(`${e.effectiveDirective} ${e.blockedURI}`);
    });
  });
}

const violations = (page: Page) => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test.describe('Security headers', { tag: '@bvt' }, () => {
  test.beforeEach(async ({ page }) => {
    await installStubs(page);
    await recordCspViolations(page);
    // Keep the test hermetic: answer the YouTube embed locally instead of hitting the network.
    await page.route(`${EMBED_ORIGIN}/**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<!doctype html><p>embed loaded</p>' }),
    );
  });

  test('production build ships a strict CSP and the app runs without violations', async ({ page }) => {
    await openHome(page);
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain(`frame-src ${EMBED_ORIGIN}`);
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'strict-origin-when-cross-origin');

    await startWorkout(page, 'Moody');
    const videoToggle = page.getByRole('radio', { name: 'Play My Video' });
    for (let i = 0; i < 60 && !(await videoToggle.isVisible()); i++) {
      await page.getByRole('button', { name: 'Skip' }).click();
    }
    await videoToggle.click();

    const iframe = page.locator('iframe');
    expect(await iframe.getAttribute('src')).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\//);
    await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
    await expect(page.frameLocator('iframe').getByText('embed loaded')).toBeVisible();

    expect(await violations(page)).toEqual([]);
  });
});
