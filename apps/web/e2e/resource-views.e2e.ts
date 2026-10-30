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

  // The reading page's edge cases, from the long-reading fixture: a name long
  // enough to truncate, a description with one unbroken string, five tags.
  const LONG = {
    path: '/fixture-user/home/documents/fixture-document-long-reading',
    name: 'Field notes from the long winter of rewriting the onboarding guide, chapter by chapter, with open questions unresolved',
  };
  const contents = (page: Page, name: string) =>
    page.getByRole('group', { name: `${name} contents` });
  const openContext = (page: Page) =>
    page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Context' })
      .click();

  for (const width of [390, 1280]) {
    for (const panel of [false, true]) {
      test(`a long document name and an unbroken description do not scroll the page sideways at ${width}${panel ? ', panel open' : ''}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(LONG.path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        if (panel) {
          await openContext(page);
          await expect(
            page.getByRole('region', { name: 'Contextual panel: Context' }),
          ).toBeVisible();
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          ),
        ).toBeLessThanOrEqual(0);
      });
    }
  }

  test('the complete title is available when the header truncates it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(LONG.path);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toHaveText(LONG.name);
    await expect(
      page.getByRole('heading', { level: 1, name: LONG.name, exact: true }),
    ).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`^${LONG.name}`));
  });

  test('a long document name keeps the frame inside the window', async ({
    page,
  }) => {
    // The page itself does not scroll sideways even when the frame is wider
    // than the window and clipped, so the check above cannot see that; this
    // measures the frame's box instead (issue 126).
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(LONG.path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const box = await page
      .locator('[data-slot="resource-frame"]')
      .boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(390);
  });

  test('Tab reaches the contents group once and arrow keys scroll it', async ({
    page,
  }) => {
    // Short enough that the body overflows, so there is something to scroll.
    await page.setViewportSize({ width: 390, height: 360 });
    await page.goto(LONG.path);
    const group = contents(page, LONG.name);
    await expect(group).toBeVisible();
    expect(
      await group.evaluate((el) => el.scrollHeight > el.clientHeight),
    ).toBe(true);

    // Nothing inside the group takes focus, so it is a single tab stop.
    expect(
      await group.evaluate(
        (el) =>
          el.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex], [contenteditable]',
          ).length,
      ),
    ).toBe(0);

    // From the header's title, Tab reaches the group.
    await page.getByRole('heading', { level: 1 }).click();
    let reached = false;
    for (let step = 0; step < 15 && !reached; step++) {
      await page.keyboard.press('Tab');
      reached = await group.evaluate((el) => el === document.activeElement);
    }
    expect(reached).toBe(true);

    expect(await group.evaluate((el) => el.scrollTop)).toBe(0);
    await page.keyboard.press('End');
    await expect
      .poll(() => group.evaluate((el) => el.scrollTop))
      .toBeGreaterThan(0);

    // The next Tab leaves it; focus is not trapped.
    await page.keyboard.press('Tab');
    expect(await group.evaluate((el) => el === document.activeElement)).toBe(
      false,
    );
  });

  test('the page shows the unavailable note and no editing controls', async ({
    page,
  }) => {
    const hydration: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydrat/i.test(message.text())) {
        hydration.push(message.text());
      }
    });
    await page.goto(LONG.path);
    const group = contents(page, LONG.name);
    const note = group.getByRole('note', { name: 'Document content' });
    await expect(note).toHaveText(/content can’t be shown yet/);
    await expect(group.getByRole('textbox')).toHaveCount(0);
    await expect(group.getByRole('button')).toHaveCount(0);
    await expect(group.getByRole('link')).toHaveCount(0);
    await expect(group.locator('[contenteditable]')).toHaveCount(0);
    await expect(group.getByRole('list', { name: 'Tags' })).toBeVisible();
    await expect(group.locator('time')).toHaveCount(2);
    expect(hydration).toEqual([]);
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
