import { expect, test } from '@playwright/test';

/*
 * The Spaces pages need a signed-in owner, which this suite has no account
 * for. What it can prove without one: both routes exist behind the guard, and
 * a visitor is sent to sign in with the way back kept, so signing in returns
 * them to the Space they asked for.
 */
for (const path of [
  '/someone/home/spaces',
  '/someone/home/spaces/9ab8c032-8759-44e9-808d-0573d13f290e',
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
