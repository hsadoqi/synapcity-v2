import { expect, test } from '@playwright/test';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the breathing circle does not scale, but the count and label still run', async ({
    page,
  }) => {
    await page.goto('/run/reset');
    const ring = page.locator('div.rounded-full.border-primary');
    await expect(ring).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await page.waitForTimeout(2200);
    await expect(ring).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
    await expect(page.getByText('Inhale').first()).toBeVisible();
  });

  test('the amber sweep does not slide in', async ({ page }) => {
    await page.goto('/');
    const row = page.getByRole('link', { name: /Quick morning/ });
    await row.hover();
    const transition = await row.evaluate(
      (el) => getComputedStyle(el, '::before').transitionDuration,
    );
    expect(transition).toBe('0s');
  });
});

test.describe('motion allowed', () => {
  test('the breathing circle grows while you inhale', async ({ page }) => {
    await page.goto('/run/reset');
    const ring = page.locator('div.rounded-full.border-primary');
    const scaleAt = async () =>
      ring.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
    const start = await scaleAt();
    await page.waitForTimeout(1800);
    expect(await scaleAt()).toBeGreaterThan(start + 0.05);
  });

  test('the step timer pulses in its last ten seconds', async ({ page }) => {
    await page.clock.install();
    await page.goto('/run/morning');
    await page.clock.fastForward(21_000);
    const timer = page.getByRole('timer', { name: 'Time left on this step' });
    await expect(timer).toHaveClass(/animate-timer-pulse/);
  });
});
