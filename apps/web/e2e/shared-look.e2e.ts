import { expect, test, type Page } from '@playwright/test';

/*
 * Guards the shared look across the two apps. Web and docs run on different ports of
 * localhost, and cookies ignore the port, so a look written by one is read by the other, the
 * same way two hosts under one parent domain share it. Each page is read right after the
 * document is parsed, before React hydrates, so only the boot scripts have run: a flash of
 * the wrong look would show here.
 */
const WEB = 'http://localhost:8080';
const DOCS = 'http://localhost:4000';
const STORAGE_KEY = 'synapcity-preferences';
const COOKIE = 'synapcity-look';

type Parsed = { mode: boolean; textSize?: string; density?: string };

async function atParse(page: Page, url: string): Promise<Parsed> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => ({
    mode: document.documentElement.classList.contains('dark'),
    textSize: document.documentElement.dataset.textSize,
    density: document.documentElement.dataset.density,
  }));
}

test('a look saved in web shows in docs with no flash', async ({ page }) => {
  // A returning visitor whose look was saved before the cookie existed. Loading web migrates
  // it into the shared cookie (a web page mounts the account sync that does it).
  await page.addInitScript(
    ([key, value]) => {
      if (location.port === '8080') localStorage.setItem(key, value);
    },
    [
      STORAGE_KEY,
      JSON.stringify({
        theme: { mode: 'dark', textSize: 120, density: 'compact' },
      }),
    ] as const,
  );
  await page.goto(`${WEB}/auth/register`);
  await expect
    .poll(async () =>
      (await page.context().cookies()).some((c) => c.name === COOKIE),
    )
    .toBe(true);

  const docs = await atParse(page, DOCS);
  expect(docs).toMatchObject({
    mode: true,
    textSize: '120',
    density: 'compact',
  });
  await page.waitForLoadState('networkidle');
  expect(
    await page.evaluate(() => document.documentElement.dataset.textSize),
  ).toBe('120');
});

test('a mode chosen in docs shows in web', async ({ page }) => {
  await page.goto(DOCS);
  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByRole('menuitemradio', { name: 'Dark' }).click();
  await expect
    .poll(async () => {
      const cookie = (await page.context().cookies()).find(
        (c) => c.name === COOKIE,
      );
      return cookie ? decodeURIComponent(cookie.value) : '';
    })
    .toContain('"mode":"dark"');

  const web = await atParse(page, `${WEB}/auth/register`);
  expect(web.mode).toBe(true);
});

test('docs shows the defaults with no cookie, without errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const docs = await atParse(page, DOCS);
  expect(docs.textSize).toBe('100');
  expect(docs.density).toBe('comfortable');
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('a tampered cookie is ignored', async ({ page, context }) => {
  await context.addCookies([
    {
      name: COOKIE,
      value: encodeURIComponent(
        JSON.stringify({
          v: 2,
          theme: { mode: 'dark', textSize: 9999 },
          appearance: {},
        }),
      ),
      url: DOCS,
    },
  ]);
  const docs = await atParse(page, DOCS);
  expect(docs.textSize).toBe('100');
  expect(docs.density).toBe('comfortable');
});
