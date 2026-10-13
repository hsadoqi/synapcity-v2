import { expect, test } from '@playwright/test';

test('home page renders its heading and call to action', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { level: 1, name: /synapcity/i }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'button' })).toBeVisible();
});
