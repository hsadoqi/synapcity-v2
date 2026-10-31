import { expect, test, type Page } from '@playwright/test';

// Geometric containment of a resource page in the signed-in shell: each
// box lies inside its parent's box and inside the window, not only "the page
// does not scroll sideways", which a centred, clipped frame passes (GitHub
// issue 126). Runs on
// the development fixture identity (SYNAPCITY_DEV_AUTH=fixture with a dev
// server); production CI skips it, as it does the other signed-in groups.
//
// The fixture lists are owned by the Document and Dashboard slices, so the
// long names are written into the rendered heading's text node after
// hydration rather than added as fixtures. Layout reads the DOM, so the shell
// is measured exactly as it would be with a record of that name.
test.describe('resource page containment in the shell', () => {
  test.skip(
    process.env.SYNAPCITY_DEV_AUTH !== 'fixture',
    'Requires the existing development fixture identity and a development server',
  );

  const PAGES = {
    Document: '/fixture-user/home/documents/fixture-document-launch-plan',
    Dashboard: '/fixture-user/home/dashboards/fixture-dashboard-project-status',
  } as const;

  // The multi-word name is over 150 characters, as in the measured failure.
  const NAMES = {
    unbroken:
      'Supercalifragilisticexpialidocious-onboarding-guide-rewrite-chapter-by-chapter-with-every-open-question-unsettled',
    'multi-word':
      'Field notes from the long winter of rewriting the onboarding guide, chapter by chapter, with every open question we could not settle before the spring release',
  } as const;

  // 1280: a 150-character multi-word name overflowed there on a real session.
  const WIDTHS = [390, 400, 640, 768, 1024, 1280];

  /** The shell's narrow line: two 16rem regions and the 48px rail. */
  const SIDE_BY_SIDE_PX = 256 * 2 + 48;

  // `next dev` compiles a route on its first visit.
  const FIRST_VISIT = { timeout: 30_000 };

  type Box = { left: number; right: number; width: number };

  const box = (page: Page, selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((element): Box => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });

  /**
   * The element's box lies inside the container's box and inside the window,
   * to half a pixel.
   */
  async function expectContained(page: Page, selector: string, within: string) {
    // Both boxes in one read, so they come from the same frame, and only once
    // two consecutive frames agree: the sidebar and panels animate their
    // widths, and a read mid-animation would pair boxes from different moments.
    const { inner, outer, viewport } = await page.evaluate(
      async ([innerSelector, outerSelector]) => {
        const read = (selector: string) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`Nothing matches ${selector}`);
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right };
        };
        const snapshot = () => ({
          inner: read(innerSelector),
          outer: read(outerSelector),
          viewport: window.innerWidth,
        });
        const frame = () =>
          new Promise((resolve) => requestAnimationFrame(resolve));
        let last = snapshot();
        // About two seconds at 60 frames a second, then measure what is there.
        for (let i = 0; i < 120; i++) {
          await frame();
          const next = snapshot();
          if (JSON.stringify(next) === JSON.stringify(last)) return next;
          last = next;
        }
        return last;
      },
      [selector, within] as const,
    );
    const where = `${selector} (${inner.left}..${inner.right})`;
    expect(
      inner.left,
      `${where} starts inside ${within}`,
    ).toBeGreaterThanOrEqual(outer.left - 0.5);
    expect(inner.right, `${where} ends inside ${within}`).toBeLessThanOrEqual(
      outer.right + 0.5,
    );
    expect(
      inner.left,
      `${where} starts inside the window`,
    ).toBeGreaterThanOrEqual(-0.5);
    expect(inner.right, `${where} ends inside the window`).toBeLessThanOrEqual(
      viewport + 0.5,
    );
  }

  /** Opens the page and waits until React has hydrated its heading. */
  async function visit(page: Page, path: string) {
    await page.goto(path, FIRST_VISIT);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible(FIRST_VISIT);
    // A dashboard renders its header again once its composition loads in the
    // browser; renaming before then would be undone. That load reads browser
    // storage, not the network, so wait for its skeleton to go.
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[aria-busy="true"]')).toHaveCount(
      0,
      FIRST_VISIT,
    );
    await page.waitForFunction(() => {
      const h1 = document.querySelector('h1');
      return !!h1 && Object.keys(h1).some((key) => key.startsWith('__react'));
    });
    return heading;
  }

  /** Renames the heading in place: its text node, which React keeps. */
  const rename = (page: Page, name: string) =>
    page.getByRole('heading', { level: 1 }).evaluate((h1, text) => {
      const node = [...h1.childNodes].find(
        (child): child is Text => child.nodeType === Node.TEXT_NODE,
      );
      if (!node) throw new Error('The heading has no text node');
      node.data = text;
    }, name);

  /** The frame and everything in it, inside the work area and the window. */
  async function expectFrameContained(page: Page) {
    await expectContained(page, '#main-content', 'body');
    await expectContained(
      page,
      '[data-slot="resource-frame"]',
      '#main-content',
    );
    await expectContained(
      page,
      '[data-slot="resource-header"]',
      '[data-slot="resource-frame"]',
    );
    await expectContained(page, 'h1', '[data-slot="resource-header"]');
    await expectContained(
      page,
      '[data-slot="contextual-panel-shell"]',
      '[data-slot="resource-frame"]',
    );
    await expectContained(
      page,
      '[data-slot="resource-body"]',
      '[data-slot="contextual-panel-shell"]',
    );
    await expectContained(
      page,
      '[data-contextual-panel-region]',
      '[data-slot="contextual-panel-shell"]',
    );
  }

  const glideEnded = (page: Page) =>
    page.waitForFunction(() =>
      [...document.querySelectorAll('[data-slot="resizable-panel"]')].every(
        (panel) => panel.getAnimations().length === 0,
      ),
    );

  for (const [consumer, path] of Object.entries(PAGES)) {
    for (const [kind, name] of Object.entries(NAMES)) {
      for (const width of WIDTHS) {
        test(`${consumer}, a long ${kind} name at ${width}: contained with the panel closed and open`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 800 });
          await visit(page, path);
          await rename(page, name);

          // Closed.
          const shell = page.locator('[data-slot="contextual-panel-shell"]');
          await expect(shell).toHaveAttribute(
            'data-contextual-panel',
            'closed',
          );
          // Truncation is visual only: the heading keeps the complete name.
          // Checked first, so a heading that was rendered again (and lost the
          // long name) fails here instead of being measured with its short one.
          await expect(
            page.getByRole('heading', { level: 1, name, exact: true }),
          ).toBeVisible();
          await expectFrameContained(page);
          await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

          // Open.
          await page
            .getByRole('toolbar', { name: 'Contextual panel' })
            .getByRole('button', { name: 'Context' })
            .click();
          const region = page.getByRole('region', {
            name: 'Contextual panel: Context',
          });
          await expect(region).toBeVisible();
          await glideEnded(page);
          await expect(
            page.getByRole('heading', { level: 1, name, exact: true }),
          ).toBeAttached();
          await expectFrameContained(page);

          const shellBox = await box(
            page,
            '[data-slot="contextual-panel-shell"]',
          );
          const main = page.locator('[data-slot="contextual-main"]');
          if (shellBox.width < SIDE_BY_SIDE_PX) {
            // Too narrow for both: the panel takes the work area beside the rail.
            await expect(shell).toHaveAttribute('data-narrow', '');
            await expect(main).toHaveAttribute('inert', '');
            const panelBox = await box(page, '[data-contextual-panel-region]');
            expect(panelBox.width).toBeGreaterThanOrEqual(
              shellBox.width - 48 - 1,
            );
          } else {
            await expect(shell).not.toHaveAttribute('data-narrow', '');
            await expect(main).not.toHaveAttribute('inert', '');
            expect(
              (await box(page, '[data-slot="contextual-main"]')).width,
            ).toBeGreaterThanOrEqual(256 - 1);
          }
        });
      }
    }
  }

  test('at 390, collapsing the full-area panel returns focus to the rail and the page', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await visit(page, PAGES.Document);
    await rename(page, NAMES.unbroken);
    const toggle = page
      .getByRole('toolbar', { name: 'Contextual panel' })
      .getByRole('button', { name: 'Context' });
    await toggle.click();
    const region = page.getByRole('region', {
      name: 'Contextual panel: Context',
    });
    await expect(region).toBeFocused();
    await expect(page.locator('[data-slot="contextual-main"]')).toHaveAttribute(
      'inert',
      '',
    );
    await region
      .getByRole('button', { name: 'Collapse contextual panel' })
      .click();
    await expect(toggle).toBeFocused();
    await expect(
      page.locator('[data-slot="contextual-main"]'),
    ).not.toHaveAttribute('inert');
    await glideEnded(page);
    await expectFrameContained(page);
  });
});
