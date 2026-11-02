import { expect, test, type Page } from '@playwright/test';

import { FIXTURE_HOME } from './support/fixture-paths';

// The authenticated shell is exercised against the existing read-only dev
// fixture identity, never a fabricated production session. Run with a dev
// server and SYNAPCITY_DEV_AUTH=fixture; production CI skips this group.
test.describe('global panel in the authenticated shell', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  const visit = async (page: Page) => {
    await page.goto(FIXTURE_HOME);
    await page.waitForLoadState('networkidle');
    return page.getByRole('button', { name: 'Toggle global panel' });
  };

  // Opening and closing glide: a CSS transition on the panels' flex-grow
  // (GlobalPanelShell). The panel is visible from its first frame, so a size
  // read before the transition ends is a frame of the animation, and a handle
  // found then moves out from under the pointer before the drag starts.
  const glideEnded = (page: Page) =>
    page.waitForFunction(() =>
      [...document.querySelectorAll('[data-slot="resizable-panel"]')].every(
        (panel) => panel.getAnimations().length === 0,
      ),
    );

  test('reflows the page, resizes, remembers settled size, and can be dragged shut', async ({
    page,
  }) => {
    const toggle = await visit(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const main = page.getByRole('main');
    const originalTop = (await main.boundingBox())!.y;
    await toggle.click();
    const panel = page.getByRole('region', { name: 'Global panel' });
    await expect(panel).toBeVisible();
    await glideEnded(page);
    expect((await main.boundingBox())!.y).toBeGreaterThan(originalTop);
    const handle = page.getByRole('separator', { name: 'Resize global panel' });
    const box = (await handle.boundingBox())!;
    const openHeight = (await panel.boundingBox())!.height;
    const startY = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width / 2, startY);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + 100, { steps: 10 });
    await page.mouse.up();
    const height = (await panel.boundingBox())!.height;
    // A drag never animates: the panel grows by exactly the pointer's travel.
    expect(height).toBeCloseTo(openHeight + (box.y + 100 - startY), 0);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({ ...viewport, height: viewport.height + 100 });
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeCloseTo(height, 0);
    await toggle.click();
    await toggle.click();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeCloseTo(height, 0);
    await glideEnded(page);
    const resized = (await handle.boundingBox())!;
    await page.mouse.move(
      resized.x + resized.width / 2,
      resized.y + resized.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(resized.x + resized.width / 2, originalTop, {
      steps: 15,
    });
    await page.mouse.up();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeCloseTo(height, 0);
  });

  test('supports keyboard resizing, lock, explicit close, focus recovery and outside dismissal', async ({
    page,
  }) => {
    const toggle = await visit(page);
    await toggle.click();
    const handle = page.getByRole('separator', { name: 'Resize global panel' });
    const previous = Number(await handle.getAttribute('aria-valuenow'));
    await handle.focus();
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .toBeGreaterThan(previous);
    await page.getByRole('button', { name: 'Lock global panel open' }).click();
    const lockedSize = Number(await handle.getAttribute('aria-valuenow'));
    await handle.focus();
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .toBeGreaterThan(lockedSize);
    await page.getByRole('main').click({ position: { x: 10, y: 10 } });
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('region', { name: 'Global panel' }),
    ).toBeVisible();
    await expect(page.locator('[data-slot="shell-app-header"]')).toBeHidden();
    await page.getByRole('button', { name: 'Close global panel' }).click();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await expect(
      page.getByRole('button', { name: 'Lock global panel open' }),
    ).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Close global panel' }).focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await page.getByRole('main').click({ position: { x: 10, y: 10 } });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('keeps panel size stable when locking and revealing the app header, including drag collapse', async ({
    page,
  }) => {
    const toggle = await visit(page);
    await toggle.click();
    const panel = page.getByRole('region', { name: 'Global panel' });
    const appHeader = page.locator('[data-slot="shell-app-header"]');
    await expect(panel).toBeVisible();
    await glideEnded(page);
    const panelHeight = (await panel.boundingBox())!.height;
    const workArea = page.locator('[data-slot="shell-page"]');
    const workHeight = (await workArea.boundingBox())!.height;
    await page.getByRole('button', { name: 'Lock global panel open' }).click();
    await expect(appHeader).toBeHidden();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeCloseTo(panelHeight, 0);
    await expect
      .poll(async () => (await workArea.boundingBox())!.height)
      .toBeGreaterThan(workHeight + 60);
    const reveal = page.getByRole('button', { name: 'Show app header' });
    await reveal.focus();
    await page.keyboard.press('Enter');
    await expect(appHeader).toBeVisible();
    await expect
      .poll(async () => (await panel.boundingBox())!.height)
      .toBeCloseTo(panelHeight, 0);
    await page.getByRole('button', { name: 'Hide app header' }).click();
    await expect(appHeader).toBeHidden();
    const handle = (await page
      .getByRole('separator', { name: 'Resize global panel' })
      .boundingBox())!;
    await page.mouse.move(
      handle.x + handle.width / 2,
      handle.y + handle.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2, 0, { steps: 15 });
    await page.mouse.up();
    await expect(appHeader).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(
      page.getByRole('button', { name: 'Lock global panel open' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  test.describe('touch', () => {
    test.use({ hasTouch: true });
    test('fits a narrow touch viewport and keeps the header controls reachable', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const toggle = await visit(page);
      await toggle.tap();
      await expect(
        page.getByRole('button', { name: 'Close global panel' }),
      ).toBeVisible();
      await glideEnded(page);
      const handle = page.getByRole('separator', {
        name: 'Resize global panel',
      });
      const previous = Number(await handle.getAttribute('aria-valuenow'));
      const box = (await handle.boundingBox())!;
      const touch = await page.context().newCDPSession(page);
      try {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x, y }],
        });
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x, y: y + 60 }],
        });
        await touch.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
        await expect
          .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
          .toBeGreaterThan(previous);
      } finally {
        await touch.detach();
      }
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        ),
      ).toBe(0);
      const appHeader = page.locator('[data-slot="shell-app-header"]');
      await page.getByRole('button', { name: 'Lock global panel open' }).tap();
      await expect(appHeader).toBeHidden();
      await page.getByRole('button', { name: 'Show app header' }).tap();
      await expect(appHeader).toBeVisible();
      await page.getByRole('button', { name: 'Hide app header' }).tap();
      await expect(appHeader).toBeHidden();
      await page.getByRole('button', { name: 'Close global panel' }).tap();
      await expect(appHeader).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
