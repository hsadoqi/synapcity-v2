import { expect, test, type Page } from '@playwright/test';

// Editing a dashboard (Slice 4), against the development fixture identity.
// Fixture mode has no database, so the canvas keeps its composition in this
// browser: these tests prove the interface (adding, moving, removing,
// Undo, the save status, reload), not the server path. The server path is
// covered by the unit tests of the actions and `server-data`, and the SQL
// regression script. Production CI skips this group like the other
// fixture-identity tests.
test.describe('editing a dashboard', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  const DASHBOARD =
    '/fixture-user/home/dashboards/fixture-dashboard-reading-progress';

  async function openEmpty(page: Page) {
    await page.goto(DASHBOARD);
    // Each test starts from a clean browser, so the dashboard is empty.
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.getByText('No widgets yet')).toBeVisible();
  }

  test('an empty dashboard offers Add a widget, which opens the palette with only the three widgets', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    const palette = page.getByRole('region', { name: 'Add to dashboard' });
    await expect(palette.getByRole('button')).toHaveText([
      'Pinned',
      'Last opened',
      'Spaces',
    ]);
    // Focus lands in the palette, ready to choose.
    await expect(palette.getByRole('button').first()).toBeFocused();
  });

  test('adds a widget that lists real records, saves it, and finds it after a reload', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();

    const widget = page.getByRole('region', { name: 'Pinned' });
    await expect(widget).toBeVisible();
    // Pinned fixture records are linked, as pages the person can open.
    await expect(widget.getByRole('link').first()).toHaveAttribute(
      'href',
      /\/fixture-user\/home\/(spaces|documents|dashboards)\//,
    );
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    await page.reload();
    // The first request after a reload can wait on a development compile.
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('No widgets yet')).toHaveCount(0);
  });

  test('moves a widget with the keyboard and hears where it went', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    // Focus is on the new widget; Space selects it, arrows move it.
    const cell = page.locator('[data-widget-id]').first();
    await expect(cell).toBeFocused();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByRole('status').filter({ hasText: /moved to column 2, row 1/ }),
    ).toBeAttached();
    // The widget keeps focus through the move, so the next key still reaches it.
    await expect(cell).toBeFocused();
    await page.keyboard.press('Shift+ArrowDown');
    await expect(
      page.getByRole('status').filter({ hasText: /is now 1 wide, 5 tall/ }),
    ).toBeAttached();
  });

  test('reorders with Move earlier and Move later, without pointing or spatial keys', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    await page.getByRole('button', { name: 'Spaces' }).click();
    const arrange = page.getByRole('region', { name: 'Arrange' });
    await expect(arrange.getByRole('listitem')).toHaveText([
      /Pinned/,
      /Spaces/,
    ]);
    await arrange.getByRole('button', { name: 'Move Spaces earlier' }).click();
    await expect(arrange.getByRole('listitem')).toHaveText([
      /Spaces/,
      /Pinned/,
    ]);
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: /moved earlier, position 1 of 2/ }),
    ).toBeAttached();
  });

  test('removes a widget, moves focus on, and Undo puts it back', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    await page.getByRole('button', { name: 'Spaces' }).click();

    await page.getByRole('button', { name: 'Settings for Pinned' }).click();
    await page.getByRole('button', { name: 'Remove widget' }).click();

    await expect(page.getByRole('region', { name: 'Pinned' })).toHaveCount(0);
    // Focus moved to the widget that remains.
    await expect(page.locator('[data-widget-id]').first()).toBeFocused();
    // No hidden or archived state is offered in its place.
    await expect(page.getByRole('heading', { name: /Hidden/ })).toHaveCount(0);

    await page.getByRole('button', { name: 'Undo remove Pinned' }).click();
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Undo remove Pinned' }),
    ).toHaveCount(0);
  });

  test('removing the last widget returns to the empty state, with focus on the palette', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Last opened' }).click();
    await page
      .getByRole('button', { name: 'Settings for Last opened' })
      .click();
    await page.getByRole('button', { name: 'Remove widget' }).click();
    await expect(page.getByText('No widgets yet')).toBeVisible();
    await expect(
      page
        .getByRole('region', { name: 'Add to dashboard' })
        .getByRole('button')
        .first(),
    ).toBeFocused();
  });

  test('follows the container width: a narrow window shows the stacked, single-column layout', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    await page.getByRole('button', { name: 'Spaces' }).click();
    await expect(
      page.getByRole('button', { name: 'Mobile layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
    // The page itself never scrolls sideways.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('leaving with an unsaved change asks first', async ({ page }) => {
    await openEmpty(page);
    let asked = false;
    page.on('dialog', async (dialog) => {
      asked = dialog.type() === 'beforeunload';
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    // Navigate away before the 400 ms debounce can save.
    await page.evaluate(() => {
      // A plain anchor click is a navigation the page itself starts, which is
      // what asks the beforeunload question.
      const link = document.createElement('a');
      link.href = '/fixture-user/home';
      document.body.append(link);
      link.click();
    });
    await expect.poll(() => asked).toBe(true);
  });
});
