import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import {
  headingFonts,
  lookOf,
  parseLook,
  settingsDefaults,
  type Look,
} from '@synapcity/domain-preferences';

/*
 * Guards the shared look across the two apps. Web and docs run on different ports of
 * localhost, and cookies ignore the port, so a look written by one is read by the other, the
 * same way two hosts under one parent domain share it. Each page is read right after the
 * document is parsed, before React hydrates, so the server-rendered attributes and the
 * no-cookie/system-mode boot fallback are what can prevent a flash here.
 */
// The origins this run serves, set by the shared Playwright config while it
// loads; not inputs to any Turborepo task.
/* eslint-disable turbo/no-undeclared-env-vars */
const WEB = process.env.E2E_WEB_URL!;
const DOCS = process.env.E2E_DOCS_URL!;
/* eslint-enable turbo/no-undeclared-env-vars */
const STORAGE_KEY = 'synapcity-preferences';
const COOKIE = 'synapcity-look';
const AUTH_STATE = resolve(process.cwd(), 'e2e/.auth/account.json');

const serverLook = lookOf({
  ...settingsDefaults,
  theme: {
    ...settingsDefaults.theme,
    mode: 'dark',
    density: 'compact',
    textSize: 120,
  },
  appearance: {
    ...settingsDefaults.appearance,
    contrastMode: 'high',
    showBorders: true,
  },
});
const cookieHeader = (value: unknown) =>
  `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}`;

async function readLookCookie(context: BrowserContext): Promise<Look | null> {
  const cookie = (await context.cookies(WEB)).find(
    (candidate) => candidate.name === COOKIE,
  );
  if (!cookie) return null;
  try {
    return parseLook(JSON.parse(decodeURIComponent(cookie.value)));
  } catch {
    return null;
  }
}

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
    ([key, value, origin]) => {
      if (location.origin === origin) localStorage.setItem(key, value);
    },
    [
      STORAGE_KEY,
      JSON.stringify({
        theme: { mode: 'dark', textSize: 120, density: 'compact' },
      }),
      WEB,
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

test('both servers render and renew a valid shared look', async ({
  request,
}) => {
  for (const url of [`${WEB}/auth/register`, DOCS]) {
    const response = await request.get(url, {
      headers: { Cookie: cookieHeader(serverLook) },
    });
    expect(response.ok(), url).toBe(true);
    const htmlTag = (await response.text()).match(/<html[^>]*>/)?.[0];
    expect(htmlTag, url).toMatch(/class="[^"]*\bdark\b/);
    expect(htmlTag, url).toContain('data-density="compact"');
    expect(htmlTag, url).toContain('data-text-size="120"');
    expect(htmlTag, url).toContain('data-contrast="high"');
    expect(htmlTag, url).toContain('data-borders="true"');
    expect(htmlTag, url).toContain('--text-scale:1.2');

    const renewed = response.headers()['set-cookie'];
    expect(renewed, url).toContain(`${COOKIE}=`);
    expect(renewed, url).toContain('Max-Age=31536000');
    expect(renewed, url).toContain('SameSite=Lax');
    expect(renewed, url).not.toContain('HttpOnly');
  }
});

test('servers neither render nor renew an invalid shared look', async ({
  request,
}) => {
  for (const url of [`${WEB}/auth/register`, DOCS]) {
    const response = await request.get(url, {
      headers: {
        Cookie: cookieHeader({
          ...serverLook,
          theme: { ...serverLook.theme, density: 'unknown' },
        }),
      },
    });
    expect(response.ok(), url).toBe(true);
    const htmlTag = (await response.text()).match(/<html[^>]*>/)?.[0];
    expect(htmlTag, url).not.toContain('data-density=');
    expect(response.headers()['set-cookie'] ?? '', url).not.toContain(
      `${COOKIE}=`,
    );
  }
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

test('authenticated web rendering prefers account fonts over a stale cookie', async ({
  browser,
}) => {
  test.skip(
    !existsSync(AUTH_STATE),
    'Create e2e/.auth/account.json with an existing signed-in account to run this check.',
  );

  const context = await browser.newContext({ storageState: AUTH_STATE });
  try {
    const page = await context.newPage();
    await page.addInitScript(
      (key) => localStorage.removeItem(key),
      STORAGE_KEY,
    );
    await context.clearCookies({ name: COOKIE });
    await page.goto(`${WEB}/auth/register`, { waitUntil: 'domcontentloaded' });
    await expect(
      page.getByRole('button', { name: 'Account menu' }),
    ).toBeVisible();
    await expect.poll(() => readLookCookie(context)).not.toBeNull();

    const accountLook = await readLookCookie(context);
    expect(accountLook).not.toBeNull();
    const staleFont = headingFonts.find(
      (font) => font !== accountLook!.theme.headingFont,
    );
    expect(staleFont).toBeDefined();

    const staleLook: Look = {
      ...accountLook!,
      theme: { ...accountLook!.theme, headingFont: staleFont! },
    };
    await context.addCookies([
      {
        name: COOKIE,
        value: encodeURIComponent(JSON.stringify(staleLook)),
        url: WEB,
      },
    ]);

    const response = await context.request.get(`${WEB}/auth/register`);
    expect(response.ok()).toBe(true);
    const htmlTag = (await response.text()).match(/<html[^>]*>/)?.[0];
    const encodedLook = htmlTag?.match(/data-synapcity-look="([^"]*)"/)?.[1];
    expect(encodedLook).toBeTruthy();

    const renderedLook = parseLook(
      JSON.parse(encodedLook!.replaceAll('&quot;', '"')),
    );
    expect(renderedLook?.theme.headingFont).toBe(
      accountLook!.theme.headingFont,
    );
    expect(renderedLook?.theme.headingFont).not.toBe(staleFont);
  } finally {
    await context.close();
  }
});
