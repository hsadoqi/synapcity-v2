import { expect, test } from '@playwright/test';

/*
 * The `(public)` and `(auth)` groups give their pages the public shell, not
 * the workspace shell, and the auth pages keep the share image the root layout
 * defines. A signed-out visitor is enough to see all of that.
 */
for (const path of ['/', '/privacy', '/auth/login', '/auth/register']) {
  test(`${path} uses the public shell and has a main landmark`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page.locator('[data-slot="public-shell"]')).toBeVisible();
    await expect(page.locator('[data-slot="authenticated-shell"]')).toHaveCount(
      0,
    );
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  });
}

test('the sign-in page keeps the share image and gets its own title', async ({
  page,
}) => {
  await page.goto('/auth/login');

  await expect(page).toHaveTitle('Sign in | Synapcity');
  await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
});

test('the callback is still reached through the proxy', async ({ request }) => {
  const response = await request.get('/auth/callback', { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(new URL(response.headers().location ?? '', 'http://x').pathname).toBe(
    '/auth/error',
  );
});

test('an unknown nested address shows the not-found page in the public shell', async ({
  page,
}) => {
  const response = await page.goto('/privacy/missing');

  expect(response?.status()).toBe(404);
  await expect(page.locator('[data-slot="public-shell"]')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'We could not find that page' }),
  ).toBeVisible();
});

/*
 * Landmarks and the skip link, page by page. The public shell and the auth
 * column must each leave exactly one banner, one main, one heading and a
 * footer, so a shell never nests inside another.
 */
const pages = [
  { path: '/', heading: 'Welcome to Synapcity Web' },
  { path: '/privacy', heading: 'Privacy' },
  { path: '/auth/login', heading: 'Sign in' },
  { path: '/auth/register', heading: 'Sign up' },
  { path: '/auth/forgot-password', heading: 'Reset your password' },
  { path: '/auth/error', heading: 'That link did not work' },
];

for (const { path, heading } of pages) {
  test.describe(`${path} landmarks`, () => {
    test('has one banner, one main, one heading and a footer', async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      await expect(
        page.getByRole('heading', { level: 1, name: heading }),
      ).toHaveCount(1);
    });

    test('lets the skip link move focus to the content', async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      await page.keyboard.press('Tab');
      await expect(
        page.getByRole('link', { name: 'Skip to main content' }),
      ).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(page.locator('#main-content')).toBeFocused();
    });

    test('serves the site share image and a titled page', async ({ page }) => {
      await page.goto(path);

      const image = await page
        .locator('meta[property="og:image"]')
        .getAttribute('content');
      expect(new URL(image ?? '', 'http://x').pathname).toBe(
        '/opengraph-image',
      );
      await expect(page).toHaveTitle(/Synapcity/);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
    });
  });
}

test('an address no group matches is a 404 inside one public shell', async ({
  page,
}) => {
  const response = await page.goto('/a/page/that/does/not/exist');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('banner')).toHaveCount(1);
});

test('the sign-in card keeps a gutter on a narrow phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/auth/login');

  const card = await page.locator('main [data-slot="card"]').boundingBox();
  expect(card?.x).toBeGreaterThanOrEqual(16);
  expect((card?.x ?? 0) + (card?.width ?? 0)).toBeLessThanOrEqual(320 - 16);
});
