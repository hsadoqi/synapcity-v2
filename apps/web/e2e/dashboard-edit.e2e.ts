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
    // The canvas follows its own width, and the open Widgets panel takes room
    // from it: a wide window keeps the desktop layout, where a move to the
    // next column exists.
    await page.setViewportSize({ width: 1920, height: 1000 });
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

  test('Edit layout opens the Widgets panel, and closing the panel keeps editing and the widget', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();

    const rail = page.getByRole('toolbar', { name: 'Contextual panel' });
    const widgets = rail.getByRole('button', { name: 'Widgets' });
    await expect(widgets).toHaveAttribute('aria-pressed', 'true');
    // Close the panel: editing, the widget and the save state are the store's, not the panel's.
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('button', { name: 'Edit layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    // Reopening shows the palette again, still editing.
    await widgets.click();
    await expect(
      page.getByRole('region', { name: 'Add to dashboard' }),
    ).toBeVisible();
  });

  test('switching the panel to Context and back keeps editing and the palette', async ({
    page,
  }) => {
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    const rail = page.getByRole('toolbar', { name: 'Contextual panel' });
    await rail.getByRole('button', { name: 'Context' }).click();
    await expect(
      page.getByRole('region', { name: 'Contextual panel: Context' }),
    ).toBeVisible();
    await rail.getByRole('button', { name: 'Widgets' }).click();
    await expect(
      page.getByRole('region', { name: 'Add to dashboard' }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Edit layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
  });

  test('choosing Widgets while not editing explains, and only its Edit layout button starts editing', async ({
    page,
  }) => {
    await openEmpty(page);
    const rail = page.getByRole('toolbar', { name: 'Contextual panel' });
    await rail.getByRole('button', { name: 'Widgets' }).click();
    await expect(
      page.getByText(/Choose Edit layout to add widgets/),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Add to dashboard' }),
    ).toHaveCount(0);
    await page
      .locator('[data-slot="widgets-destination-idle"]')
      .getByRole('button', { name: 'Edit layout' })
      .click();
    await expect(
      page.getByRole('region', { name: 'Add to dashboard' }),
    ).toBeVisible();
  });

  test('on a phone-width screen the opened Widgets panel covers the canvas, the addition is announced, and closing it returns to the widget', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 414, height: 800 });
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    const palette = page.getByRole('region', { name: 'Add to dashboard' });
    await expect(palette).toBeVisible();
    await expect(palette.getByRole('button').first()).toBeFocused();

    await palette.getByRole('button', { name: 'Pinned' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Pinned added' }),
    ).toBeAttached();
    // The panel stays open and keeps focus; nothing was pulled into the covered canvas.
    await expect(palette).toBeVisible();
    await expect(palette.getByRole('button', { name: 'Pinned' })).toBeFocused();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    await page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Widgets' })
      .click();
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Edit layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  /**
   * Both widths a frame decision depends on: the window's, and the canvas's
   * own content width (what the canvas measures; its 40 px padding excluded).
   */
  async function widths(page: Page) {
    return page.evaluate(() => {
      const canvas = document.querySelector<HTMLElement>(
        '[data-slot="dashboard-canvas"]',
      );
      if (!canvas) throw new Error('No dashboard canvas');
      const style = getComputedStyle(canvas);
      return {
        viewport: window.innerWidth,
        canvas:
          canvas.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight),
      };
    });
  }

  test('an unlocked tablet width draws no device frame', async ({ page }) => {
    // Measured (S2 Task 1): at this window the canvas resolves to tablet and
    // is wider than the 834 px frame plus its chrome, where a frame used to
    // appear without anyone choosing it.
    await page.setViewportSize({ width: 1350, height: 900 });
    await openEmpty(page);
    await expect(
      page.getByRole('button', { name: 'Tablet layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
    const { viewport, canvas } = await widths(page);
    expect(viewport).toBe(1350);
    expect(canvas).toBeGreaterThan(834 + 80);
    expect(canvas).toBeLessThan(1024);
    await expect(page.getByText('Tablet · 834px')).toHaveCount(0);
  });

  test('choosing Tablet layout on a wide window draws the frame, and a narrow window drops it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEmpty(page);
    await page.getByRole('button', { name: 'Tablet layout' }).click();
    await expect(page.getByText('Tablet · 834px')).toBeVisible();
    expect((await widths(page)).canvas).toBeGreaterThan(834 + 80);

    await page.setViewportSize({ width: 700, height: 900 });
    await expect(page.getByText('Tablet · 834px')).toHaveCount(0);
    expect((await widths(page)).canvas).toBeLessThan(834 + 80);
    // The preview stays chosen; only its frame went.
    await expect(
      page.getByRole('button', { name: 'Tablet layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('a locked preview survives opening and closing the Widgets panel', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await openEmpty(page);
    await page.getByRole('button', { name: 'Add a widget' }).click();
    await page.getByRole('button', { name: 'Pinned' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();
    const widgets = page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Widgets' });
    // Closed, the canvas is wide enough for the desktop layout.
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('button', { name: 'Desktop layout' }),
    ).toHaveAttribute('aria-pressed', 'true');

    // Count every write to this browser's saved dashboards from here on.
    await page.evaluate(() => {
      const writes: string[] = [];
      Object.assign(window, { dashboardWrites: writes });
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith('synapcity.dashboard.')) writes.push(key);
        return setItem.call(this, key, value);
      };
    });

    const tablet = page.getByRole('button', { name: 'Tablet layout' });
    await tablet.click();
    await expect(page.getByText('Tablet · 834px')).toBeVisible();
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-pressed', 'true');
    await expect(tablet).toHaveAttribute('aria-pressed', 'true');
    await widgets.click();
    await expect(widgets).toHaveAttribute('aria-pressed', 'false');

    // Back at a desktop width, the chosen preview is still the one shown.
    await expect(tablet).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Tablet · 834px')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
    // Past the 400 ms save debounce: choosing a preview and moving the panel
    // saved nothing.
    await page.waitForTimeout(800);
    expect(
      await page.evaluate(
        () =>
          (window as unknown as { dashboardWrites: string[] }).dashboardWrites,
      ),
    ).toEqual([]);
  });

  test('a seeded fixture dashboard opens with its widgets and writes nothing until edited', async ({
    page,
  }) => {
    await page.goto(
      '/fixture-user/home/dashboards/fixture-dashboard-project-status',
    );
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    for (const name of ['Pinned', 'Last opened', 'Spaces']) {
      await expect(page.getByRole('region', { name })).toBeVisible({
        timeout: 15_000,
      });
    }
    // Past the 400 ms save debounce, and across a width change that resolves
    // another layout: rendering the seed saved nothing.
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(
      page.getByRole('button', { name: 'Tablet layout' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await page.waitForTimeout(800);
    const saved = await page.evaluate(() =>
      Object.keys(localStorage).filter((key) =>
        key.startsWith('synapcity.dashboard.'),
      ),
    );
    expect(saved).toEqual([]);
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
