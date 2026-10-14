import { expect, test } from '@playwright/test';

test('home page renders its heading and call to action', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: /synapcity/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Go to your workspace' }),
  ).toHaveAttribute('href', '/developer/home');
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible();
});

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    test('skip link appears on first Tab with readable contrast', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.keyboard.press('Tab');
      const link = page.getByRole('link', { name: 'Skip to main content' });

      await expect(link).toBeFocused();
      await expect(async () => {
        const box = await link.boundingBox();
        expect(box?.y).toBeGreaterThanOrEqual(0);
      }).toPass();

      // Resolve both colours to sRGB through a canvas (computed styles may be lab()).
      const ratio = await link.evaluate((el) => {
        type Rgb = [number, number, number];
        const toRgb = (css: string): Rgb => {
          const ctx = document.createElement('canvas').getContext('2d')!;
          ctx.fillStyle = css;
          ctx.fillRect(0, 0, 1, 1);
          const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
          return [r, g, b];
        };
        const channel = (v: number) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        const luminance = ([r, g, b]: Rgb) =>
          0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        const style = getComputedStyle(el);
        const text = luminance(toRgb(style.color));
        const fill = luminance(toRgb(style.backgroundColor));
        return (Math.max(text, fill) + 0.05) / (Math.min(text, fill) + 0.05);
      });
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
}
