import { expect, test } from '@playwright/test';

/*
 * iOS Safari zooms into any focused field whose text is under 16px. Fields on
 * touch screens use the 16px `text-touch-field` size; mouse-driven layouts keep
 * the compact size.
 */
const devices = [
  { name: 'phone', viewport: { width: 375, height: 740 }, touch: true },
  // A tablet is both `md` and touch: the touch size must still win.
  { name: 'tablet', viewport: { width: 1024, height: 1366 }, touch: true },
  { name: 'desktop', viewport: { width: 1280, height: 800 }, touch: false },
] as const;

for (const { name, viewport, touch } of devices) {
  test.describe(`${name} fields`, () => {
    test.use({ viewport, hasTouch: touch, isMobile: touch });

    test(
      touch ? 'are at least 16px' : 'keep the compact size',
      async ({ page }) => {
        await page.goto('/auth/register');
        const sizes = await page
          .locator('input:visible:not([type="hidden"])')
          .evaluateAll((inputs) =>
            inputs.map((input) => parseFloat(getComputedStyle(input).fontSize)),
          );

        const heights = await page
          .locator('input:visible:not([type="hidden"])')
          .evaluateAll((inputs) =>
            inputs.map((input) => input.getBoundingClientRect().height),
          );
        for (const height of heights) {
          if (touch) expect(height).toBeGreaterThanOrEqual(44);
          else expect(height).toBeLessThan(44);
        }

        expect(sizes.length).toBeGreaterThan(0);
        for (const size of sizes) {
          if (touch) expect(size).toBeGreaterThanOrEqual(16);
          else expect(size).toBeLessThan(16);
        }
      },
    );
  });
}
