import { expect, test } from '@playwright/test';

test.describe('leaving, restarting and resuming', () => {
  test('Escape leaves straight away when nothing is answered', async ({
    page,
  }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('region', { name: 'Run in progress' }),
    ).toHaveCount(0);
  });

  test('Escape asks first once there is progress', async ({ page }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('6');
    await page.keyboard.press('Escape');
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('Leave this run?');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page).toHaveURL(/\/run\/morning/);
  });

  test('leave and keep progress, then resume where you were, paused', async ({
    page,
  }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('7');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Breathing Exercise' }),
    ).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Gratitude' }),
    ).toBeVisible();
    await page.getByRole('checkbox').first().click();

    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Leave, keep progress' }).click();
    await expect(page).toHaveURL('/');

    const banner = page.getByRole('region', { name: 'Run in progress' });
    await expect(banner).toContainText('Quick morning, step 3 of 5');
    await banner.getByRole('link', { name: /Resume/ }).click();

    await expect(
      page.getByRole('heading', { name: 'Gratitude' }),
    ).toBeVisible();
    await expect(page.getByRole('checkbox').first()).toBeChecked();
    await expect(
      page.getByRole('button', { name: 'Resume timer' }),
    ).toBeVisible();
  });

  test('a reload picks the run back up', async ({ page }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('9');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Breathing Exercise' }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Breathing Exercise' }),
    ).toBeVisible();
    await page.keyboard.press('b');
    await expect(page.getByRole('radio', { name: '9 of 10' })).toBeChecked();
  });

  test('restart asks first, then clears the answers', async ({ page }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('9');
    await page.getByRole('button', { name: 'Restart' }).click();
    await expect(page.getByRole('alertdialog')).toContainText(
      'Restart this run?',
    );
    await page.getByRole('button', { name: 'Restart run' }).click();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(
      page.getByRole('timer', { name: 'Time left on this step' }),
    ).toHaveText('0:30');
  });

  test('discarding from the dialog leaves nothing to resume', async ({
    page,
  }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('4');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Discard run' }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('region', { name: 'Run in progress' }),
    ).toHaveCount(0);
  });
});
