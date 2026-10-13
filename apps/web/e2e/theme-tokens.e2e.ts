import { expect, test } from '@playwright/test';

/*
 * Guards the colour tokens through what actually renders. A token the browser
 * rejects (such as `var(--x)/20`) silently falls back, so checking the CSS
 * source is not enough: these resolve computed colours to sRGB and measure.
 */
for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} theme tokens`, () => {
    test.use({ colorScheme });

    test('card, muted text and field borders keep their contrast', async ({
      page,
    }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      const measured = await page.evaluate(() => {
        type Rgba = [number, number, number, number];
        const ctx = document.createElement('canvas').getContext('2d')!;
        const toRgba = (css: string): Rgba => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = css;
          ctx.fillRect(0, 0, 1, 1);
          const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(
            0,
            0,
            1,
            1,
          ).data;
          return [r, g, b, a];
        };
        const channel = (v: number) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        const luminance = ([r, g, b]: Rgba) =>
          0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        const ratio = (x: Rgba, y: Rgba) => {
          const [a, b] = [luminance(x), luminance(y)];
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        };

        const card = document.querySelector<HTMLElement>('[data-slot="card"]')!;
        const description = document.querySelector<HTMLElement>(
          '[data-slot="card-description"]',
        )!;
        const input = document.querySelector<HTMLElement>('#email')!;
        const cardFill = toRgba(getComputedStyle(card).backgroundColor);

        return {
          cardAlpha: cardFill[3],
          mutedOnCard: ratio(
            toRgba(getComputedStyle(description).color),
            cardFill,
          ),
          bodyOnCard: ratio(toRgba(getComputedStyle(card).color), cardFill),
          inputBorderOnCard: ratio(
            toRgba(getComputedStyle(input).borderTopColor),
            cardFill,
          ),
        };
      });

      expect(measured.cardAlpha, 'card surface is opaque').toBe(255);
      expect(measured.mutedOnCard).toBeGreaterThanOrEqual(4.5);
      // Muted text must actually be a quieter tier than body text.
      expect(measured.mutedOnCard).toBeLessThan(measured.bodyOnCard * 0.6);
      expect(measured.inputBorderOnCard).toBeGreaterThanOrEqual(3);
    });

    test('the filled button keeps a solid, readable hover', async ({
      page,
    }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      const button = page.getByRole('button', { name: 'Sign in', exact: true });

      const read = () =>
        button.evaluate((el) => {
          const ctx = document.createElement('canvas').getContext('2d')!;
          const toRgba = (css: string) => {
            ctx.clearRect(0, 0, 1, 1);
            ctx.fillStyle = css;
            ctx.fillRect(0, 0, 1, 1);
            const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(
              0,
              0,
              1,
              1,
            ).data;
            return { r, g, b, a };
          };
          const channel = (v: number) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          };
          const lum = ({ r, g, b }: { r: number; g: number; b: number }) =>
            0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
          const style = getComputedStyle(el);
          const fill = toRgba(style.backgroundColor);
          const label = toRgba(style.color);
          const [x, y] = [lum(fill), lum(label)];
          return {
            alpha: fill.a,
            fill: x,
            contrast: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05),
          };
        });

      const rest = await read();
      await button.hover();
      await expect.poll(async () => (await read()).fill).not.toBe(rest.fill);
      const hover = await read();

      expect(hover.alpha, 'hover fill is solid, not a translucent wash').toBe(
        255,
      );
      expect(
        hover.contrast,
        'label stays readable on hover',
      ).toBeGreaterThanOrEqual(4.5);
    });

    test('focus outlines stand out from the card', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      for (const target of [
        page.getByLabel('Email'),
        page.getByRole('button', { name: 'Sign in', exact: true }),
        page.getByRole('link', { name: 'Forgot password?' }),
      ]) {
        // Keyboard focus, so :focus-visible applies as it does for real users.
        await target.focus();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(target).toBeFocused();

        await expect
          .poll(() =>
            target.evaluate((el) => {
              const ctx = document.createElement('canvas').getContext('2d')!;
              const toRgb = (css: string) => {
                ctx.clearRect(0, 0, 1, 1);
                ctx.fillStyle = css;
                ctx.fillRect(0, 0, 1, 1);
                const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(
                  0,
                  0,
                  1,
                  1,
                ).data;
                return { r, g, b, a };
              };
              const channel = (v: number) => {
                const c = v / 255;
                return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
              };
              const lum = ({ r, g, b }: { r: number; g: number; b: number }) =>
                0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
              const style = getComputedStyle(el);
              if (
                style.outlineStyle === 'none' ||
                parseFloat(style.outlineWidth) < 2
              )
                return 0;
              const outline = toRgb(style.outlineColor);
              if (outline.a < 255) return 0;
              const card = toRgb(
                getComputedStyle(el.closest('[data-slot="card"]')!)
                  .backgroundColor,
              );
              const [x, y] = [lum(outline), lum(card)];
              return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
            }),
          )
          .toBeGreaterThanOrEqual(3);
      }
    });
  });
}
