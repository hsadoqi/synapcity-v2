import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { finishMorning } from './helpers';

const VIEWS = ['focus', 'stage', 'workbench'] as const;

async function audit(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map(
      (v) =>
        `${label}: ${v.id} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`,
    ),
  ).toEqual([]);
}

test('the layout switch changes the look and is remembered', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-view', 'focus');
  await page.getByRole('button', { name: 'Stage' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-view', 'stage');
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'dark');
  await page.getByRole('button', { name: 'Workbench' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-tone', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-view', 'workbench');
  await expect(page.getByRole('button', { name: 'Workbench' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

for (const view of VIEWS) {
  test.describe(`${view} view`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await context.addCookies([
        { name: 'mr-view', value: view, url: baseURL! },
      ]);
    });

    // Reduced motion keeps the audit deterministic: contrast is measured on settled colours,
    // not on a frame of a fade-in.
    test.describe('accessibility', () => {
      test.use({ reducedMotion: 'reduce' });

      test('has no serious accessibility violations on any screen', async ({
        page,
      }) => {
        await page.goto('/');
        await audit(page, `${view} home`);

        await page.goto('/run/morning');
        await expect(
          page.getByRole('heading', { name: 'Energy Check' }),
        ).toBeVisible();
        await page.keyboard.press('7');
        await audit(page, `${view} rating`);
        await page.keyboard.press('Enter');
        await expect(
          page.getByRole('heading', { name: 'Breathing Exercise' }),
        ).toBeVisible();
        await audit(page, `${view} breathing`);
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        await audit(page, `${view} multi pick`);
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        await page.keyboard.press('Enter');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        await audit(page, `${view} single pick`);
        await page.keyboard.press('Enter');
        await page.waitForURL(/\/done\//);
        await page.waitForTimeout(2200);
        await audit(page, `${view} done`);

        for (const path of ['/today', '/history', '/builder', '/focus']) {
          await page.goto(path);
          await page.waitForTimeout(500);
          await audit(page, `${view} ${path}`);
        }
      });
    });

    test('has no horizontal scroll on a phone', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 760 });
      for (const path of ['/', '/run/body', '/builder', '/history', '/today']) {
        await page.goto(path);
        await page.waitForTimeout(300);
        const wide = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(wide, `${view} ${path}`).toBeLessThanOrEqual(1);
      }
    });
  });
}

test('every screen works end to end after finishing a run in each view', async ({
  page,
  context,
  baseURL,
}) => {
  for (const view of VIEWS) {
    await context.addCookies([{ name: 'mr-view', value: view, url: baseURL! }]);
    await finishMorning(page);
    await expect(
      page.getByRole('region', { name: "Today's intention" }),
    ).toBeVisible();
  }
});
