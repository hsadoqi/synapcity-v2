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
