import { expect, test, type Page } from '@playwright/test';

import {
  createTemporaryUser,
  localStack,
  removeTemporaryUser,
  type LocalStack,
  type TemporaryUser,
} from './support/local-stack';

/*
 * The server path of Dashboard editing: a real session, the Server Actions and
 * the database. It runs under `pnpm test:e2e:local-session` and is skipped in a
 * normal run (no stack, no account). It provisions what it needs: one temporary
 * user and one pinned Dashboard (so the Pinned widget has something to list),
 * both removed afterwards; the Dashboard goes with its owner. The database
 * creates the Dashboard's composition itself (revision 1), so the page opens
 * without any first-save special case.
 */
const stack = localStack();
test.skip(
  !stack,
  'Needs the local Supabase stack: pnpm test:e2e:local-session',
);
test.describe.configure({ mode: 'serial' });

let user: TemporaryUser;
let dashboardPath: string;

/** A pinned, empty Dashboard for the user, made with the service key (provisioning only). */
async function createDashboard(
  s: LocalStack,
  owner: TemporaryUser,
): Promise<string> {
  const response = await fetch(`${s.apiUrl}/rest/v1/dashboards`, {
    method: 'POST',
    headers: {
      apikey: s.serviceKey,
      Authorization: `Bearer ${s.serviceKey}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      owner_id: owner.id,
      name: 'Persistence check',
      pinned_at: new Date().toISOString(),
    }),
  });
  if (!response.ok)
    throw new Error(`Creating the dashboard failed: ${response.status}`);
  const [created] = (await response.json()) as { id: string }[];
  if (!created) throw new Error('The dashboard was not returned.');
  return `/${owner.id}/home/dashboards/${created.id}`;
}

async function signIn(page: Page) {
  await page.goto('/auth/login');
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(`**/${user.id}/home`);
}

test.beforeAll(async () => {
  if (!stack) return;
  user = await createTemporaryUser(stack);
  dashboardPath = await createDashboard(stack, user);
});
test.afterAll(async () => {
  if (stack && user) await removeTemporaryUser(stack, user);
});

test.describe('dashboard composition on the server', () => {
  test('saves, survives a reload, refuses to overwrite newer work, and recovers from a failed save', async ({
    page,
    context,
  }) => {
    await signIn(page);
    const path = dashboardPath;

    await test.step('opens the new dashboard (the database made its composition) and adds a widget that lists real records', async () => {
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
