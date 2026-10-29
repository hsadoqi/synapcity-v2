import { expect, test } from '@playwright/test';

// Document and dashboard pages, against the existing read-only dev fixture
// identity. Run with a dev server and SYNAPCITY_DEV_AUTH=fixture; production
// CI skips this group, as it does the other signed-in tests.
test.describe('document and dashboard pages', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  test('a document opens from its card, named in the heading and trail', async ({
    page,
  }) => {
    await page.goto('/fixture-user/home/documents');
    await page.getByRole('link', { name: 'Launch plan' }).first().click();
    await expect(page).toHaveURL(
      /\/fixture-user\/home\/documents\/fixture-document-launch-plan$/,
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Launch plan' }),
    ).toBeVisible();
    const trail = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(trail.getByRole('link', { name: 'Documents' })).toBeVisible();
    await expect(page.getByText(/content can’t be shown yet/)).toBeVisible();
  });

  test('a dashboard opens read-only, with the contextual panel beside it', async ({
    page,
  }) => {
    await page.goto(
      '/fixture-user/home/dashboards/fixture-dashboard-project-status',
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Project status' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit layout' })).toHaveCount(
      0,
    );
    await page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Context' })
      .click();
    await expect(
      page.getByRole('region', { name: 'Contextual panel: Context' }),
    ).toBeVisible();
  });

  for (const kind of ['documents', 'dashboards'] as const) {
    test(`an unknown record in ${kind} is not found`, async ({ page }) => {
      const response = await page.goto(`/fixture-user/home/${kind}/no-such-id`);
      expect(response?.status()).toBe(404);
    });
  }
});
