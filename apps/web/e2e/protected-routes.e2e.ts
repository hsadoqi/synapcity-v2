import { expect, test } from '@playwright/test';

/*
 * The signed-in owner area needs an account this suite does not have. What it
 * can prove without one: every protected path sends a signed-out visitor to
 * sign in with the full path and query kept, and public and auth pages do not
 * redirect. The same cases must pass before and after the routes are grouped.
 */
for (const path of [
  '/someone/home',
  '/someone/home/documents',
  '/someone/home/dashboards',
  '/someone/settings',
  '/someone/home/spaces?view=list',
]) {
  test(`sends a signed-out visitor from ${path} to sign in and back`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveURL(/\/auth\/login\?/);
    expect(new URL(page.url()).searchParams.get('next')).toBe(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });
}

// The proxy does not match a bare `/<userId>`, which cannot be told apart from
// a public one-segment page. The `(protected)` layout sends a signed-out
// visitor to sign in instead. A layout cannot read the request path, so this
// redirect carries no `next`; signing in then lands on the person's own home.
test('sends a signed-out visitor from a bare /someone to sign in', async ({
  page,
}) => {
  await page.goto('/someone');

  await expect(page).toHaveURL(/\/auth\/login$/);
});

for (const path of [
  '/',
  '/privacy',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
]) {
  test(`does not redirect a signed-out visitor away from ${path}`, async ({
    page,
  }) => {
    const response = await page.goto(path);

    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(path);
  });
}
