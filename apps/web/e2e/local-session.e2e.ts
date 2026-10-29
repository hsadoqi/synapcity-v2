import { expect, test, type Browser, type Page } from '@playwright/test';

import {
  createTemporaryUser,
  localStack,
  newestLinkTo,
  removeTemporaryUser,
  type TemporaryUser,
} from './support/local-stack';

/*
 * Signed-in checks against the local Supabase stack, run by
 * `pnpm test:e2e:local-session` (see apps/web/README.md). Skipped in a normal
 * run: CI has no stack and no account. One temporary user is created in the
 * local stack and removed afterwards; nothing hosted is touched.
 */
const stack = localStack();
test.skip(
  !stack,
  'Needs the local Supabase stack: pnpm test:e2e:local-session',
);
test.describe.configure({ mode: 'serial' });

let user: TemporaryUser;

test.beforeAll(async () => {
  if (stack) user = await createTemporaryUser(stack);
});
test.afterAll(async () => {
  if (stack && user) await removeTemporaryUser(stack, user);
});

const home = () => `/${user.id}/home`;
const settings = () => `/${user.id}/settings`;

async function signIn(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`**${home()}`);
}

async function signedInPage(browser: Browser) {
  const page = await (await browser.newContext()).newPage();
  await signIn(page);
  return page;
}

const slots = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-slot$="-shell"]')].map(
      (element) => (element as HTMLElement).dataset.slot,
    ),
  );

// The workspace has two (header and sidebar foot); the first is the header's.
// The session is `sb-<ref>-auth-token` (or numbered chunks of it); the PKCE
// verifier of a started sign-in is the separate `...-code-verifier`.
const isSessionCookie = (c: { name: string; value: string }) =>
  /^sb-.*-auth-token(\.\d+)?$/.test(c.name) && Boolean(c.value);
const isVerifierCookie = (c: { name: string }) =>
  /^sb-.*-auth-token-code-verifier$/.test(c.name);

const accountMenu = (page: Page) =>
  page.getByRole('button', { name: 'Account menu' }).first();

test('signing in reaches the workspace shell through the real app and stack', async ({
  browser,
}) => {
  const page = await signedInPage(browser);

  expect(await slots(page)).toEqual(['authenticated-shell']);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(accountMenu(page)).toBeVisible();
});

for (const { path, heading } of [
  { path: '/', heading: 'Welcome to Synapcity Web' },
  { path: '/privacy', heading: 'Privacy' },
]) {
  test(`${path} is public for a signed-in visitor: public shell and account menu`, async ({
    browser,
  }) => {
    const page = await signedInPage(browser);

    await page.goto(path);

    expect(await slots(page)).toEqual(['public-shell']);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toHaveCount(1);
    await expect(accountMenu(page)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
  });
}

test('the landing page leads back into the workspace', async ({ browser }) => {
  const page = await signedInPage(browser);
  await page.goto('/');

  await page.getByRole('link', { name: 'Go to your workspace' }).click();

  await expect(page).toHaveURL(new RegExp(`${home()}$`));
  expect(await slots(page)).toEqual(['authenticated-shell']);
});

test('the account menu works from the keyboard and returns focus', async ({
  browser,
}) => {
  const page = await signedInPage(browser);
  await page.goto('/privacy');

  const trigger = accountMenu(page);
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem', { name: 'Settings' })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.keyboard.press('Enter');
  await page.getByRole('menuitem', { name: 'Settings' }).click();
  await expect(page).toHaveURL(new RegExp(`${settings()}$`));
  expect(await slots(page)).toEqual(['authenticated-shell']);
});

test('the chosen theme follows the person between the public and workspace shells', async ({
  browser,
}) => {
  const page = await signedInPage(browser);
  await page.goto('/privacy');

  await page.getByRole('button', { name: 'Theme' }).click();
  await page.getByText('Dark', { exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.goto(home());
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.goto('/auth/forgot-password');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('guest-facing auth pages send a signed-in visitor on, as before', async ({
  browser,
}) => {
  const page = await signedInPage(browser);

  for (const path of ['/auth/login', '/auth/register']) {
    await page.goto(path);
    await expect(page, path).toHaveURL(new RegExp(`${home()}$`));
  }
});

for (const { path, heading } of [
  { path: '/auth/forgot-password', heading: 'Reset your password' },
  { path: '/auth/update-password', heading: 'Choose a new password' },
  { path: '/auth/delete-account', heading: 'Ask for a new link' },
  { path: '/auth/error', heading: 'That link did not work' },
  { path: '/auth/welcome', heading: /./ },
]) {
  test(`${path} renders for a signed-in visitor in one public shell`, async ({
    browser,
  }) => {
    const page = await signedInPage(browser);

    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    expect(await slots(page)).toEqual(['public-shell']);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(
      page.getByRole('heading', { level: 1, name: heading }),
    ).toHaveCount(1);
    await expect(
      page.getByRole('heading', { name: 'Something went wrong' }),
    ).toHaveCount(0);
    await expect(accountMenu(page)).toBeVisible();
  });
}

test('unknown addresses end in one shell each: workspace inside the owner area, public elsewhere', async ({
  browser,
}) => {
  const page = await signedInPage(browser);
  const notFound = page.getByRole('heading', {
    name: 'We could not find that page',
  });

  // A single segment is read as an owner id, so another person's area and a
  // mistyped page both answer inside the workspace.
  for (const path of ['/someone-else/home', '/nope']) {
    expect((await page.goto(path))?.status(), path).toBe(404);
    // Next serves a 404 raised inside a matched route as a bootstrap document;
    // the shell and message render once it hydrates (also true on main).
    await expect(notFound, path).toBeVisible();
    expect(await slots(page), path).toEqual(['authenticated-shell']);
    await expect(page.getByRole('main'), path).toHaveCount(1);
  }

  // Records that do not exist keep the workspace and its sidebar.
  const missing = '00000000-0000-0000-0000-000000000000';
  for (const kind of ['spaces', 'documents', 'dashboards']) {
    const path = `${home()}/${kind}/${missing}`;
    expect((await page.goto(path))?.status(), path).toBe(404);
    // Next serves a 404 raised inside a matched route as a bootstrap document;
    // the shell and message render once it hydrates (also true on main).
    await expect(notFound, path).toBeVisible();
    expect(await slots(page), path).toEqual(['authenticated-shell']);
    await expect(page.getByRole('main'), path).toHaveCount(1);
  }

  // Deeper than any public route: the public boundary, one shell.
  expect((await page.goto('/privacy/missing'))?.status()).toBe(404);
  await expect(notFound).toBeVisible();
  expect(await slots(page)).toEqual(['public-shell']);
  await expect(page.getByRole('main')).toHaveCount(1);
});

test('effective metadata of a protected page keeps the site title and share image', async ({
  browser,
}) => {
  const page = await signedInPage(browser);

  for (const path of [home(), settings()]) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(/Synapcity/);
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    expect(new URL(image ?? '', 'http://x').pathname, path).toBe(
      '/opengraph-image',
    );
  }
});

test('signing out returns to a public page, drops the session and protects the workspace again', async ({
  browser,
}) => {
  const page = await signedInPage(browser);
  await page.goto('/privacy');

  await accountMenu(page).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await expect(
    page.getByRole('link', { name: 'Sign in' }).first(),
  ).toBeVisible();

  const cookies = await page.context().cookies();
  expect(cookies.some(isSessionCookie)).toBe(false);

  await page.goto(home());
  await expect(page).toHaveURL(/\/auth\/login\?next=/);
  expect(new URL(page.url()).searchParams.get('next')).toBe(home());
});

/*
 * The real code exchange: the app starts a password reset (which stores the
 * PKCE verifier in this browser), the local stack mails the link, and opening
 * it takes the browser through the stack's verify endpoint and then
 * /auth/callback, which exchanges the code for a session.
 */

/*
 * The browser opens the mailed link and follows every redirect itself: the
 * stack's verify endpoint, then /auth/callback, then wherever the callback
 * sends it. Nothing is mapped or substituted. The callback's own response
 * (status, Location, Set-Cookie) is recorded as it passes, and its Location
 * must name the browser's origin, or the cookies it just set would be lost.
 *
 * The callback answers with a relative Location, so the browser resolves it
 * against the host it is on. (An absolute one built from `request.nextUrl`
 * would name `localhost` for a browser on `127.0.0.1`: Next rewrites every
 * loopback host there. See the callback route.)
 */
type CallbackAnswer = {
  status: number;
  location: string;
  setCookies: string[];
};

async function openLinkThroughCallback(
  page: Page,
  link: string,
  baseURL: string,
): Promise<CallbackAnswer> {
  const answers: CallbackAnswer[] = [];
  page.on('response', async (response) => {
    if (new URL(response.url()).pathname !== '/auth/callback') return;
    const headers = await response.headersArray();
    answers.push({
      status: response.status(),
      location:
        headers.find((h) => h.name.toLowerCase() === 'location')?.value ?? '',
      setCookies: headers
        .filter((h) => h.name.toLowerCase() === 'set-cookie')
        .map((h) => h.value),
    });
  });

  await page.goto(link);

  const answer = answers[0];
  if (!answer) throw new Error('The link never reached /auth/callback.');
  expect(answer.location, 'the callback must redirect').not.toBe('');
  expect(
    new URL(answer.location, baseURL).origin,
    'the callback redirected away from the browser origin',
  ).toBe(new URL(baseURL).origin);
  return answer;
}

test.describe('the callback exchanges a real code', () => {
  async function requestResetLink(page: Page) {
    const sentAfter = Date.now() - 1000;
    await page.goto('/auth/forgot-password');
    await page.locator('input[name="email"]').fill(user.email);
    await page.getByRole('button', { name: 'Send reset link' }).click();
    return newestLinkTo(stack!, user.email, sentAfter);
  }

  test('signs the person in, sets the session cookie and lands on the reset page', async ({
    browser,
    baseURL,
  }) => {
    const page = await (await browser.newContext()).newPage();
    const link = await requestResetLink(page);
    const before = await page.context().cookies();
    expect(before.some(isSessionCookie)).toBe(false);
    expect(before.some(isVerifierCookie)).toBe(true);

    const answer = await openLinkThroughCallback(page, link, baseURL!);

    // The server exchanged the code and redirected to the requested page,
    // without echoing the code, and set the session on that response.
    expect(answer.status).toBe(307);
    expect(new URL(answer.location, 'http://x').pathname).toBe(
      '/auth/update-password',
    );
    expect(answer.location).not.toMatch(/code=/);
    expect(answer.setCookies.some((c) => /^sb-.*-auth-token=/.test(c))).toBe(
      true,
    );
    await expect(page).toHaveURL(/\/auth\/update-password$/);
    const after = await page.context().cookies();
    const session = after.filter(isSessionCookie);
    expect(session.length).toBeGreaterThan(0);
    expect(session.every((c) => c.path === '/' && c.sameSite === 'Lax')).toBe(
      true,
    );
    expect(after.some(isVerifierCookie)).toBe(false);
    expect(await slots(page)).toEqual(['public-shell']);
    await expect(accountMenu(page)).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Choose a new password' }),
    ).toBeVisible();

    // The same link cannot be used again.
    const second = await (await browser.newContext()).newPage();
    const replay = await openLinkThroughCallback(second, link, baseURL!);
    expect(new URL(replay.location, 'http://x').pathname).toBe('/auth/error');
    expect(new URL(replay.location, 'http://x').search).toBe('?reason=reset');
    expect(
      replay.setCookies.some((c) => /^sb-.*-auth-token=[^;]/.test(c)),
    ).toBe(false);
  });

  test('ignores an unsafe destination and sends the person to their own home', async ({
    browser,
    baseURL,
  }) => {
    const page = await (await browser.newContext()).newPage();
    const link = new URL(await requestResetLink(page));
    const target = new URL(link.searchParams.get('redirect_to') ?? '');
    target.searchParams.set('next', '//evil.example/steal');
    link.searchParams.set('redirect_to', target.toString());

    const answer = await openLinkThroughCallback(
      page,
      link.toString(),
      baseURL!,
    );

    expect(answer.status).toBe(307);
    expect(new URL(answer.location, 'http://x').pathname).toBe(home());
    expect(answer.location).not.toMatch(/evil/);
    await expect(page).toHaveURL(new RegExp(`${home()}$`));
  });
});
