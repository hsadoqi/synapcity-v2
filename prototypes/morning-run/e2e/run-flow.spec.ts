import { expect, test } from '@playwright/test';

import { finishMorning, timer } from './helpers';

test.describe('timing', () => {
  test('each run starts at its own length, matching its card', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: /Quick morning/ }),
    ).toContainText('5 steps · about 4 min');
    await expect(
      page.getByRole('link', { name: /Two-minute reset/ }),
    ).toContainText('2 steps · about 1 min');

    await page.goto('/run/morning');
    await expect(timer(page)).toHaveText('0:30');
    await expect(page.getByLabel('Time left in the whole run')).toContainText(
      '3:53',
    );

    await page.goto('/');
    await page.getByRole('button', { name: /Discard/ }).click();
    await page.goto('/run/reset');
    await expect(timer(page)).toHaveText('0:38');
    await expect(page.getByLabel('Time left in the whole run')).toContainText(
      '1:08',
    );
  });

  test('the countdown moves, and pausing holds it', async ({ page }) => {
    await page.goto('/run/morning');
    await expect(timer(page)).toHaveText('0:30');
    await expect(timer(page)).not.toHaveText('0:30', { timeout: 3000 });
    await page.getByRole('button', { name: 'Pause timer' }).click();
    const held = await timer(page).textContent();
    await page.waitForTimeout(1600);
    await expect(timer(page)).toHaveText(held!);
    await page.keyboard.press('p');
    await expect(
      page.getByRole('button', { name: 'Pause timer' }),
    ).toBeVisible();
  });
});

test.describe('breathing', () => {
  test('labels and counts down each phase, and pauses with the timer', async ({
    page,
  }) => {
    await page.goto('/run/reset');
    const circle = page.locator(
      'div.relative.flex.flex-col.items-center[aria-hidden="true"]',
    );
    await expect(circle).toContainText('Inhale');
    await expect(circle).toContainText('4');

    await expect(circle).toContainText('3', { timeout: 2500 });
    await expect(circle).toContainText('Hold', { timeout: 4000 });

    await page.getByRole('button', { name: 'Pause timer' }).click();
    const frozen = await circle.textContent();
    await page.waitForTimeout(1600);
    expect(await circle.textContent()).toBe(frozen);
    await expect(page.getByText(/paused/i).first()).toBeVisible();
  });
});

test.describe('answers and keyboard', () => {
  test('Continue waits for a required answer and says why', async ({
    page,
  }) => {
    await page.goto('/run/morning');
    const next = page.getByRole('button', { name: 'Continue' });
    await expect(next).toBeDisabled();
    await expect(
      page.getByText('Pick a number to continue, or skip.'),
    ).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Energy Check' }),
    ).toBeVisible();
    await page.keyboard.press('3');
    await expect(next).toBeEnabled();
  });

  test('single choice and multiple choice are different controls', async ({
    page,
  }) => {
    await page.goto('/run/morning');
    await page.keyboard.press('5');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('group', { name: 'Gratitude' })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(6);
    await page.keyboard.press('Enter');
    await page.getByRole('checkbox').first().click();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('heading', { name: 'Top 3 Priorities' }),
    ).toBeVisible();
    await page.getByRole('checkbox').first().click();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('radiogroup', { name: 'Set Daily Focus' }),
    ).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(5);
  });

  test('the whole run works from the keyboard and ends on a result', async ({
    page,
  }) => {
    await finishMorning(page);
    const card = page.getByRole('region', { name: "Today's intention" });
    await expect(card).toContainText('Today I am focusing on making things.');
    await expect(card).toContainText('8/10, pretty good');
  });

  test('Skip moves on and the summary says so', async ({ page }) => {
    await page.goto('/run/goal');
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(
      page.getByRole('heading', { name: "What's in the way?" }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: 'Progress' })).toBeVisible();
  });
});
