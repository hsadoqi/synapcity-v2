import { existsSync } from 'node:fs';

import { expect, test } from '@playwright/test';

// The server path of dashboard editing (Slice 4): a real session, the Server
// Actions and the database. It cannot run on the development fixture identity
// or in production CI, so it is skipped unless a saved session and a
// dashboard to use are supplied:
//
//   E2E_AUTH_STATE      path to a Playwright storage state of a signed-in
//                       dedicated test account (default e2e/.auth/account.json,
//                       git-ignored)
//   E2E_DASHBOARD_PATH  path of an EMPTY dashboard that account owns, such as
//                       /<userId>/home/dashboards/<dashboardId>
//
// The test adds and removes widgets on that dashboard and leaves it empty.
const STATE = process.env.E2E_AUTH_STATE ?? 'e2e/.auth/account.json';
const DASHBOARD = process.env.E2E_DASHBOARD_PATH;
const ready = existsSync(STATE) && Boolean(DASHBOARD);

test.use({ storageState: existsSync(STATE) ? STATE : undefined });

test.describe('dashboard composition on the server', () => {
  test.skip(
    !ready,
    'Needs E2E_DASHBOARD_PATH and a saved session of a dedicated test account (see this file)',
  );

  test('saves, survives a reload, refuses to overwrite newer work, and recovers from a failed save', async ({
    page,
    context,
  }) => {
    const path = DASHBOARD as string;

    await test.step('opens the empty dashboard and adds a widget that lists real records', async () => {
      await page.goto(path);
      await expect(page.getByText('No widgets yet')).toBeVisible();
      await page.getByRole('button', { name: 'Add a widget' }).click();
      await page.getByRole('button', { name: 'Pinned' }).click();
      await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Pinned' }).getByRole('link').first(),
      ).toBeVisible();
      // "Saved" only after the server confirmed.
      await expect(page.getByText('Saved', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step('finds the widget after a full reload, from the database', async () => {
      await page.reload();
      await expect(page.getByRole('region', { name: 'Pinned' })).toBeVisible();
      await expect(page.getByText('No widgets yet')).toHaveCount(0);
    });

    await test.step('a second tab with stale data cannot overwrite the first', async () => {
      const other = await context.newPage();
      await other.goto(path);
      await expect(other.getByRole('region', { name: 'Pinned' })).toBeVisible();

      // The first tab saves a change; the other still holds the old revision.
      await page.getByRole('button', { name: 'Edit layout' }).click();
      await page.getByRole('button', { name: 'Spaces' }).click();
      await expect(page.getByText('Saved', { exact: true })).toBeVisible({
        timeout: 15_000,
      });

      await other.getByRole('button', { name: 'Edit layout' }).click();
      await other.getByRole('button', { name: 'Last opened' }).click();
      await expect(other.getByText(/Changed elsewhere/)).toBeVisible({
        timeout: 15_000,
      });
      await expect(other.getByText('Saved', { exact: true })).toHaveCount(0);

      // Reload shows what the first tab saved, and not the stale tab's edit.
      await other.getByRole('button', { name: 'Reload' }).click();
      await expect(other.getByRole('region', { name: 'Spaces' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(
        other.getByRole('region', { name: 'Last opened' }),
      ).toHaveCount(0);
      await other.close();
    });

    await test.step('a failed save says so, keeps the edit, and Retry saves it', async () => {
      let blocked = true;
      await page.route('**/*', async (route) => {
        const request = route.request();
        if (
          blocked &&
          request.method() === 'POST' &&
          request.headers()['next-action']
        ) {
          await route.abort('failed');
        } else {
          await route.continue();
        }
      });
      await page.getByRole('button', { name: 'Last opened' }).click();
      await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByText(/Not saved/)).toBeVisible();
      await expect(
        page.getByRole('region', { name: 'Last opened' }),
      ).toBeVisible();

      blocked = false;
      await page.getByRole('button', { name: 'Retry' }).click();
      await expect(page.getByText('Saved', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await page.unroute('**/*');

      await page.reload();
      await expect(
        page.getByRole('region', { name: 'Last opened' }),
      ).toBeVisible();
    });

    await test.step('removes the widgets again, leaving the dashboard empty', async () => {
      await page.getByRole('button', { name: 'Edit layout' }).click();
      for (const title of ['Pinned', 'Spaces', 'Last opened']) {
        await page
          .getByRole('button', { name: `Settings for ${title}` })
          .click();
        await page.getByRole('button', { name: 'Remove widget' }).click();
      }
      await expect(page.getByText('No widgets yet')).toBeVisible();
      await expect(page.getByText('Saved', { exact: true })).toBeVisible({
        timeout: 15_000,
      });
      await page.reload();
      await expect(page.getByText('No widgets yet')).toBeVisible();
    });
  });
});
