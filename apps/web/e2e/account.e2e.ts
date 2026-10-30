import { randomBytes } from 'node:crypto';

import { expect, test } from '@playwright/test';

import {
  localStack,
  newestLinkTo,
  removeTemporaryUser,
  type TemporaryUser,
} from './support/local-stack';

/*
 * The account flows on the local stack, through the real app: sign up (with the
 * real confirmation mail from the stack's mailbox), set a name on the welcome
 * step, change the name in Settings. Runs under `pnpm test:e2e:local-session`;
 * skipped otherwise. The address has the shape the runner's own cleanup
 * recognizes, so a run that dies midway is swept up by the next one.
 *
 * Not covered here: the photo. The profile only accepts an https avatar URL
 * (`profiles_avatar_url_https`), and the local stack's public Storage URL is
 * http, so the app's avatar save fails against it by design; the bucket's
 * behavior is covered by the Storage test in `@synapcity/server-data`, and the
 * rest by the avatar flow's own unit tests. Anything an attempt leaves in
 * Storage is still removed afterwards.
 */
const stack = localStack();
test.skip(
  !stack,
  'Needs the local Supabase stack: pnpm test:e2e:local-session',
);
test.describe.configure({ mode: 'serial' });

const email = `route-groups-e2e-${Date.now()}-${randomBytes(4).toString('hex')}@example.test`;
const password = `Aa1!${randomBytes(9).toString('base64url')}`;
let userId = '';

const admin = () => ({
  apikey: stack!.serviceKey,
  Authorization: `Bearer ${stack!.serviceKey}`,
});

async function findUserId(address: string): Promise<string> {
  const response = await fetch(
    `${stack!.apiUrl}/auth/v1/admin/users?per_page=200`,
    {
      headers: admin(),
    },
  );
  const { users = [] } = (await response.json()) as {
    users?: { id: string; email?: string }[];
  };
  const found = users.find((u) => u.email === address);
  if (!found) throw new Error('The new account was not found in the stack.');
  return found.id;
}

async function removeAvatars(id: string) {
  const listed = await fetch(
    `${stack!.apiUrl}/storage/v1/object/list/avatars`,
    {
      method: 'POST',
      headers: { ...admin(), 'content-type': 'application/json' },
      body: JSON.stringify({ prefix: id, limit: 100 }),
    },
  );
  if (!listed.ok) return;
  const objects = (await listed.json()) as { name: string }[];
  for (const { name } of objects) {
    await fetch(`${stack!.apiUrl}/storage/v1/object/avatars/${id}/${name}`, {
      method: 'DELETE',
      headers: admin(),
    });
  }
}

test.afterAll(async () => {
  if (!stack || !userId) return;
  await removeAvatars(userId);
  const user: TemporaryUser = { id: userId, email, password };
  await removeTemporaryUser(stack, user);
});

test('sign up, confirm by email, set a name, then change the name', async ({
  page,
}) => {
  const started = Date.now() - 2000;

  await test.step('signs up and is told to check the mail', async () => {
    await page.goto('/auth/register');
    await page.getByLabel('Name', { exact: true }).fill('E2E Person');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(
      page.getByText(/check your email|confirm/i).first(),
    ).toBeVisible({
      timeout: 15_000,
    });
    userId = await findUserId(email);
  });

  await test.step('cannot sign in before confirming (confirmation is required)', async () => {
    const response = await fetch(
      `${stack!.apiUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: stack!.serviceKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
    );
    expect(response.ok).toBe(false);
  });

  await test.step('follows the emailed link and lands on the welcome step', async () => {
    const link = await newestLinkTo(stack!, email, started);
    await page.goto(link);
    await page.waitForURL('**/auth/welcome**', { timeout: 20_000 });
    await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
      'E2E Person',
    );
  });

  await test.step('saves the name and carries on to the workspace', async () => {
    await page.getByLabel('Name', { exact: true }).fill('E2E Welcome');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForURL(`**/${userId}/home**`, { timeout: 20_000 });
  });

  await test.step('changes the name in Settings and finds it after a reload', async () => {
    await page.goto(`/${userId}/settings`);
    await page.getByRole('button', { name: 'Edit name' }).click();
    await page.getByLabel('Name', { exact: true }).fill('E2E Renamed');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('E2E Renamed').first()).toBeVisible({
      timeout: 15_000,
    });
    await page.reload();
    await expect(page.getByText('E2E Renamed').first()).toBeVisible();
  });
});
