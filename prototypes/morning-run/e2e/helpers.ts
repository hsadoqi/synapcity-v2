import { expect, type Page } from '@playwright/test';

/** Complete the Quick morning run with the keyboard only. */
export async function finishMorning(page: Page) {
  await page.goto('/run/morning');
  await expect(
    page.getByRole('heading', { name: 'Energy Check' }),
  ).toBeVisible();
  await page.keyboard.press('8');
  await page.keyboard.press('Enter');

  await expect(
    page.getByRole('heading', { name: 'Breathing Exercise' }),
  ).toBeVisible();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Gratitude' })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');

  await expect(
    page.getByRole('heading', { name: 'Top 3 Priorities' }),
  ).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');

  await expect(
    page.getByRole('heading', { name: 'Set Daily Focus' }),
  ).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/done\//);
}

export const timer = (page: Page) =>
  page.getByRole('timer', { name: 'Time left on this step' });
