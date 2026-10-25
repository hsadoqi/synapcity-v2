import { expect, test } from '@playwright/test';

test('build a custom run, pin it beside the built-ins, and run it', async ({
  page,
}) => {
  await page.goto('/builder');
  await page.getByLabel('Name').fill('Sunday reset');
  await page
    .getByLabel('One line about it')
    .fill('Plan the week and the weekend');
  await page.getByRole('button', { name: /Energy check/ }).click();
  await page.getByRole('button', { name: /Reach out/ }).click();
  await page.getByRole('button', { name: /Free write/ }).click();
  await expect(
    page.getByText('3 steps · about 3 min', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save and start' }).click();

  await expect(page).toHaveURL(/\/run\/custom-/);
  await expect(
    page.getByRole('heading', { name: 'Energy check' }),
  ).toBeVisible();
  await page.keyboard.press('6');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Reach out' })).toBeVisible();
  await page.getByRole('checkbox').first().click();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('heading', { name: "What's on your mind?" }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: "What's on your mind?" })
    .fill('Call Sam about the weekend.');
  await page.keyboard.press('Control+Enter');
  await page.waitForURL(/\/done\//);
  await expect(
    page.getByRole('region', { name: "Today's intention" }),
  ).toContainText('Sunday reset');
  await expect(
    page.getByText('Call Sam about the weekend.').first(),
  ).toBeVisible();

  await page.goto('/');
  const pinned = page.getByRole('region', { name: 'Pinned' });
  await expect(
    pinned.getByRole('link', { name: /Sunday reset/ }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'My runs' })
      .getByRole('link', { name: /Sunday reset/ }),
  ).toBeVisible();
});

test('says what is missing before saving', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const alert = page.locator(
    'div[role="alert"]:not(#__next-route-announcer__)',
  );
  await expect(alert).toContainText('give it a name');
  await expect(alert).toContainText('add at least one step');
  await expect(page).toHaveURL('/builder');
});

test('edits and deletes a custom run', async ({ page }) => {
  await page.goto('/builder');
  await page.getByLabel('Name').fill('Throwaway');
  await page
    .getByRole('button', { name: /Rating/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/builder');
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page.getByLabel('Name')).toHaveValue('Throwaway');
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Delete run' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: /Throwaway/ })).toHaveCount(0);
});
