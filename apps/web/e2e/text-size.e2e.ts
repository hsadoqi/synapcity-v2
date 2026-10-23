import { expect, test, type Page } from '@playwright/test';

/*
 * Guards the text size setting through what actually renders, the way theme-shape.e2e.ts guards
 * radius and density: the saved percentage reaches the page before first paint (the boot script),
 * turns into --text-base-size (preferences.css) and resizes real text. The register page has no
 * settings provider, so this measures the boot path alone.
 */
const STORAGE_KEY = 'synapcity-preferences';

async function bodySize(page: Page, saved?: Record<string, unknown>) {
  if (saved) {
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key, value),
      [STORAGE_KEY, JSON.stringify(saved)] as const,
    );
  }
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' });
  const textSize = await page.evaluate(
    () => document.documentElement.dataset.textSize,
  );
  await page.waitForLoadState('networkidle');
  const size = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.body).fontSize),
  );
  return { textSize, size };
}

test('the default is 100%, the 15px body size', async ({ page }) => {
  const { textSize, size } = await bodySize(page);
  expect(textSize).toBe('100');
  expect(size).toBeCloseTo(15, 1);
});

for (const percent of [80, 150]) {
  test(`a saved ${percent}% scales the body text from first paint`, async ({
    page,
  }) => {
    const { textSize, size } = await bodySize(page, {
      theme: { textSize: percent },
    });
    expect(textSize).toBe(String(percent));
    expect(size).toBeCloseTo((15 * percent) / 100, 1);
  });
}

test('an old "large" preset still reads as 115% before settings are saved again', async ({
  page,
}) => {
  const { textSize, size } = await bodySize(page, {
    appearance: { fontSize: 'large' },
  });
  expect(textSize).toBe('115');
  expect(size).toBeCloseTo(17.25, 1);
});
