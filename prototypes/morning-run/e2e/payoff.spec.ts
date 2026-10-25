import { expect, test } from '@playwright/test';

import { finishMorning } from './helpers';

test.describe('the completion card', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await finishMorning(page);
  });

  test('copies the intention', async ({ page }) => {
    await page.getByRole('button', { name: 'Copy' }).click();
    await expect(page.getByText('Copied to clipboard')).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Today I am focusing on making things.');
    expect(text).toContain('Energy: 8/10, pretty good');
  });

  test('downloads Markdown and an image', async ({ page }) => {
    const [md] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Markdown' }).click(),
    ]);
    expect(md.suggestedFilename()).toMatch(/^intention-.*\.md$/);

    const [png] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Image' }).click(),
    ]);
    expect(png.suggestedFilename()).toMatch(/^intention-.*\.png$/);
    const path = await png.path();
    const { statSync } = await import('node:fs');
    expect(statSync(path).size).toBeGreaterThan(5_000);
  });

  test('starts a focus session paced by the energy rating', async ({
    page,
  }) => {
    await page
      .getByRole('link', { name: 'Start focus session' })
      .first()
      .click();
    await expect(page).toHaveURL('/focus');
    await expect(page.getByLabel('What are you working on?')).toHaveValue(
      'Making things',
    );
    const timer = page.getByRole('timer');
    await expect(timer).toHaveText('50:00');
    await page.getByRole('button', { name: 'Start' }).click();
    await expect(timer).not.toHaveText('50:00', { timeout: 3000 });
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  });

  test('files everything on today and keeps a private history', async ({
    page,
  }) => {
    await page.getByRole('link', { name: 'Open today' }).click();
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
    const task = page.getByRole('checkbox', { name: 'Finish the draft' });
    await task.click();
    await expect(task).toBeChecked();
    await page.reload();
    await expect(
      page.getByRole('checkbox', { name: 'Finish the draft' }),
    ).toBeChecked();

    await page.goto('/history');
    await expect(
      page.getByRole('link', { name: /Quick morning/ }),
    ).toBeVisible();
    await expect(page.getByText('Stored in this browser only')).toBeVisible();
  });

  test('moves a widget with the keyboard and remembers it', async ({
    page,
  }) => {
    await page.goto('/today');
    const grip = page.getByRole('button', { name: /^Move Tasks/ });
    // react-grid-layout positions each widget with a transform on its wrapper.
    const place = () =>
      page
        .getByRole('region', { name: 'Tasks' })
        .locator('xpath=..')
        .evaluate((el) => (el as HTMLElement).style.transform);
    const before = await place();
    await grip.focus();
    for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowRight');
    await expect.poll(place).not.toBe(before);
    const moved = await place();
    await page.reload();
    await expect.poll(place).toBe(moved);
  });
});
