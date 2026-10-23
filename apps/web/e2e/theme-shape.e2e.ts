import { expect, test, type Page } from '@playwright/test';

/*
 * Guards corner radius and density through what actually renders. A saved choice has to reach
 * the page before first paint (the boot script), turn into the right CSS (preferences.css) and
 * resize real components. The preference is written before the page loads, as it is for a
 * returning visitor. The register page carries a card and a text field; the provider that
 * normally rewrites the attributes is not mounted there, so this measures the boot path alone.
 */
const STORAGE_KEY = 'synapcity-preferences';

async function load(page: Page, theme?: Record<string, unknown>) {
  if (theme) {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify({ theme })] as const,
    );
  }
  // Read right after the document is parsed, before React hydrates: only the boot script has
  // run, so a flash of the wrong shape would show here.
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });
  const attributes = await page.evaluate(() => ({
    radius: document.documentElement.dataset.radius,
    density: document.documentElement.dataset.density,
  }));
  await page.waitForLoadState('networkidle');
  return attributes;
}

/** The card's corner radius and the text field's height, as the browser computed them. */
const measure = (page: Page) =>
  page.evaluate(() => {
    const card = document.querySelector<HTMLElement>('[data-slot="card"]')!;
    const input = document.querySelector<HTMLElement>('#email')!;
    return {
      radius: parseFloat(getComputedStyle(card).borderTopLeftRadius),
      fieldHeight: parseFloat(getComputedStyle(input).height),
    };
  });

test.describe('with a mouse', () => {
  test('keeps the look the app had before these settings, when nothing is saved', async ({
    page,
  }) => {
    expect(await load(page)).toEqual({
      radius: 'default',
      density: 'comfortable',
    });
    const { fieldHeight, radius } = await measure(page);
    expect(fieldHeight).toBe(28);
    expect(radius).toBeGreaterThan(0);
  });

  test('scales corners from the saved radius', async ({ page }) => {
    await load(page);
    const base = (await measure(page)).radius;

    for (const [radius, factor] of [
      ['sharp', 0],
      ['soft', 2],
      ['rounded', 3],
    ] as const) {
      const fresh = await page.context().newPage();
      expect(await load(fresh, { radius })).toMatchObject({ radius });
      expect((await measure(fresh)).radius).toBeCloseTo(base * factor, 1);
      await fresh.close();
    }
  });

  test('scales the field height from the saved density', async ({ page }) => {
    for (const [density, height] of [
      ['compact', 24.5],
      ['comfortable', 28],
      ['spacious', 35],
    ] as const) {
      const fresh = await page.context().newPage();
      expect(await load(fresh, { density })).toMatchObject({ density });
      expect((await measure(fresh)).fieldHeight).toBeCloseTo(height, 1);
      await fresh.close();
    }
  });

  test("keeps Compact at or above WCAG 2.5.8's 24px minimum target", async ({
    page,
  }) => {
    // Applied first: 28px is also the default, so this would pass with nothing applied.
    expect(await load(page, { density: 'compact' })).toMatchObject({
      density: 'compact',
    });
    expect((await measure(page)).fieldHeight).toBeGreaterThanOrEqual(24);
  });

  test('ignores a saved value that is not a preset', async ({ page }) => {
    expect(
      await load(page, { radius: '"><script>1</script>', density: 7 }),
    ).toEqual({ radius: 'default', density: 'comfortable' });
    expect((await measure(page)).fieldHeight).toBe(28);
  });
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('keeps fields at 44px even when Compact is saved', async ({ page }) => {
    // The coarse-pointer field is h-11 (44px); shrinking the spacing would take it below that.
    // Applied first: 44px is also the default on touch, so this would pass with nothing applied.
    expect(await load(page, { density: 'compact' })).toMatchObject({
      density: 'compact',
    });
    expect((await measure(page)).fieldHeight).toBe(44);
  });

  test('still grows with Spacious', async ({ page }) => {
    await load(page, { density: 'spacious' });
    expect((await measure(page)).fieldHeight).toBeCloseTo(55, 1);
  });
});
