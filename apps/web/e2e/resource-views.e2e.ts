import { expect, test, type Page } from '@playwright/test';

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

  test('a dashboard opens editable, with the contextual panel beside it', async ({
    page,
  }) => {
    await page.goto(
      '/fixture-user/home/dashboards/fixture-dashboard-project-status',
    );
    await expect(
      page.getByRole('heading', { level: 1, name: 'Project status' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Edit layout' }),
    ).toBeVisible();
    await expect(page.getByRole('status').first()).toBeAttached();
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
      // The workspace stays around the message, with no second shell nested in it.
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(
        page.locator('[data-slot="authenticated-shell"]'),
      ).toHaveCount(1);
      await expect(page.locator('[data-slot="public-shell"]')).toHaveCount(0);
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'We could not find that page',
        }),
      ).toBeVisible();
    });
  }
});

// The breadcrumb bridge across client navigation (ADR-0017). Unit tests cover
// the bridge in jsdom; these check it under real Next.js navigation, after
// hydration. The first server HTML is not asserted: its logo-first trail is an
// accepted limitation, not a requirement.
test.describe('breadcrumb trail across client navigation', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  const DOCUMENT = '/fixture-user/home/documents/fixture-document-launch-plan';

  // `next dev` compiles a route on its first visit, which can outlast the
  // default wait; Home took 5.2 s on a fresh server.
  const NAVIGATION = { timeout: 15_000 };

  /** Opens `path` and marks the document, so a full reload later would show. */
  const open = async (page: Page, path: string) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => Object.assign(window, { sameDocument: true }));
  };

  /** Whether every navigation since `open` stayed in the same document. */
  const stayedClientSide = (page: Page) =>
    page.evaluate(() => 'sameDocument' in window);

  // The sidebar's links share names with the trail's, so clicks go through it.
  const sidebarLink = (page: Page, name: string) =>
    page
      .locator('[data-slot="sidebar-container"]')
      .getByRole('link', { name, exact: true });

  const crumbs = (page: Page) =>
    page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('listitem');

  const switcher = (page: Page, context: string) =>
    page.getByRole('button', { name: `Switch context: ${context}` });

  test('moving from a document to a dashboard replaces the trail', async ({
    page,
  }) => {
    await open(page, DOCUMENT);
    await expect(crumbs(page)).toHaveText(['Documents', 'Launch plan']);

    await sidebarLink(page, 'Project status').click();
    await expect(page).toHaveURL(
      /\/dashboards\/fixture-dashboard-project-status$/,
      NAVIGATION,
    );
    await expect(crumbs(page)).toHaveText(['Dashboards', 'Project status']);
    expect(await stayedClientSide(page)).toBe(true);
  });

  test('going Home clears the trail', async ({ page }) => {
    await open(page, DOCUMENT);
    await expect(crumbs(page)).toHaveText(['Documents', 'Launch plan']);

    await sidebarLink(page, 'Home').click();
    await expect(page).toHaveURL(/\/fixture-user\/home$/, NAVIGATION);
    await expect(
      page.getByRole('navigation', { name: 'Breadcrumb' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('banner').getByRole('link', { name: 'Synapcity home' }),
    ).toBeVisible();
    expect(await stayedClientSide(page)).toBe(true);
  });

  test('a contextual panel destination leaves the route’s trail alone', async ({
    page,
  }) => {
    await open(page, DOCUMENT);
    await expect(crumbs(page)).toHaveText(['Documents', 'Launch plan']);

    await page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Context' })
      .click();
    await expect(
      page.getByRole('region', { name: 'Contextual panel: Context' }),
    ).toBeVisible();
    await expect(crumbs(page)).toHaveText(['Documents', 'Launch plan']);
    await expect(switcher(page, 'Global')).toBeVisible();
  });

  test('the trail and the context switcher agree into and out of a Space', async ({
    page,
  }) => {
    await open(page, DOCUMENT);
    await expect(switcher(page, 'Global')).toBeVisible();

    await sidebarLink(page, 'Writing').click();
    await expect(page).toHaveURL(
      /\/spaces\/fixture-space-writing$/,
      NAVIGATION,
    );
    await expect(crumbs(page)).toHaveText(['Spaces', 'Writing']);
    await expect(switcher(page, 'Writing')).toBeVisible();
    await expect(switcher(page, 'Global')).toHaveCount(0);

    await sidebarLink(page, 'Launch plan').click();
    await expect(page).toHaveURL(
      /\/documents\/fixture-document-launch-plan$/,
      NAVIGATION,
    );
    await expect(crumbs(page)).toHaveText(['Documents', 'Launch plan']);
    await expect(switcher(page, 'Global')).toBeVisible();
    await expect(switcher(page, 'Writing')).toHaveCount(0);
    expect(await stayedClientSide(page)).toBe(true);
  });
});
