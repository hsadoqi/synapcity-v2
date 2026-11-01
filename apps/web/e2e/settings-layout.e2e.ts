import { expect, test, type Page } from '@playwright/test';

import { FIXTURE_SETTINGS } from './support/fixture-paths';

// The settings tab card in the page's layouts (`SettingsTabShell`). Below the
// roomy breakpoint (48rem wide and 40rem tall) the page's own box scrolls, so
// the card must not clip: a clipping card holds the sticky Save and Discard
// footer inside itself and it scrolls away with the content. On a roomy, wide
// screen the preview rail sits beside the settings and scrolls on its own
// when its preview is taller than the room left for it. Runs on the
// development fixture identity (SYNAPCITY_DEV_AUTH=fixture with a dev server);
// production CI skips it, as it does the other signed-in groups.
test.describe('settings tab layout', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  // `next dev` compiles each lazily loaded tab on its first visit.
  const FIRST_LOAD = { timeout: 60_000 };

  const openTab = async (page: Page, tab: 'Regional' | 'Theme') => {
    await page.goto(`${FIXTURE_SETTINGS}#${tab.toLowerCase()}`);
    await page.getByRole('tab', { name: tab, exact: true }).click();
    await expect(page.locator('[data-slot="card-footer"]')).toBeVisible(
      FIRST_LOAD,
    );
  };

  for (const viewport of [
    { width: 390, height: 700 },
    { width: 1024, height: 600 },
  ]) {
    test(`keeps the Save footer in view at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openTab(page, 'Theme');

      const box = await page.evaluate(() => {
        const footer = document.querySelector('[data-slot="card-footer"]')!;
        const card = footer.closest('[data-slot="card"]')!;
        let scroller = card.parentElement;
        while (
          scroller &&
          !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)
        ) {
          scroller = scroller.parentElement;
        }
        scroller!.scrollTop = 0;
        return {
          viewBottom: scroller!.getBoundingClientRect().bottom,
          cardBottom: card.getBoundingClientRect().bottom,
          footerBottom: footer.getBoundingClientRect().bottom,
        };
      });

      // The tab is taller than the view, so only a sticky footer is in it.
      expect(box.cardBottom).toBeGreaterThan(box.viewBottom);
      expect(box.footerBottom).toBeLessThanOrEqual(box.viewBottom + 1);
    });
  }

  test('scrolls the preview rail when its preview is taller than the room', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 660 });
    await openTab(page, 'Theme');
    const rail = page.getByRole('complementary', { name: 'Preview' });
    await expect(rail).toBeVisible();

    const before = await rail.evaluate((element) => ({
      overflow: element.scrollHeight - element.clientHeight,
      overflowY: getComputedStyle(element).overflowY,
    }));
    // The Theme preview is taller than 660 px leaves it; this case is the point.
    expect(before.overflow).toBeGreaterThan(0);
    expect(before.overflowY).toBe('auto');

    await rail.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    expect(await rail.evaluate((element) => element.scrollTop)).toBeGreaterThan(
      0,
    );
  });
});
