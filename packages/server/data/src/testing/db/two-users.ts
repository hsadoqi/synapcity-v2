import { randomBytes } from 'node:crypto';

import {
  createRequestClient,
  type RequestCookies,
  type SupabaseServerClient,
} from '@synapcity/server-supabase';

import { stackEnv, type StackEnv } from './stack-env';

/**
 * One signed-in person. `client` is an ordinary request client holding that
 * person's own session, the same kind the app builds, so row-level security
 * applies exactly as it does in production. The service key is used only to
 * create and delete the person and is never part of this object.
 */
export type TestUser = {
  id: string;
  email: string;
  client: SupabaseServerClient;
};

const DOMAIN = 'synapcity.test';

/** An in-memory cookie jar standing in for a browser or a request. */
function cookieJar(): RequestCookies {
  const jar = new Map<string, string>();
  return {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    set: (name, value) => void jar.set(name, value),
  };
}

function adminHeaders(env: StackEnv) {
  return {
    apikey: env.serviceKey,
    Authorization: `Bearer ${env.serviceKey}`,
    'content-type': 'application/json',
  };
}

async function createUser(
  env: StackEnv,
  runId: string,
  label: string,
): Promise<TestUser> {
  const email = `harness-${runId}-${label}@${DOMAIN}`;
  const password = `Aa1!${randomBytes(9).toString('base64url')}`;
  const created = await fetch(`${env.apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(env),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: `Harness ${label.toUpperCase()}` },
    }),
  });
  if (!created.ok) {
    throw new Error(`Creating test user ${label} failed: ${created.status}`);
  }
  const { id } = (await created.json()) as { id: string };

  const client = createRequestClient({
    url: env.apiUrl,
    publishableKey: env.publishableKey,
    cookies: cookieJar(),
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Signing in test user ${label} failed: ${error.code}`);
  }
  return { id, email, client };
}

async function deleteUser(env: StackEnv, id: string): Promise<void> {
  const response = await fetch(`${env.apiUrl}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(env),
  });
  // A user already gone is a clean state; anything else must not hide.
  if (!response.ok && response.status !== 404) {
    throw new Error(`Deleting test user ${id} failed: ${response.status}`);
  }
}

/**
 * Runs `run` with two signed-in people, A and B, then deletes exactly the two
 * it created, also when `run` throws. Rows they own go with them by cascade.
 * Nothing else is deleted: the run id in the address is unique to this call.
 */
export async function withTwoUsers(
  run: (a: TestUser, b: TestUser) => Promise<void>,
): Promise<void> {
  const env = stackEnv();
  const runId = randomBytes(5).toString('hex');
  const created: string[] = [];
  let failure: unknown;
  try {
    const a = await createUser(env, runId, 'a');
    created.push(a.id);
    const b = await createUser(env, runId, 'b');
    created.push(b.id);
    await run(a, b);
  } catch (error) {
    failure = error;
  } finally {
    for (const id of created) {
      try {
        await deleteUser(env, id);
      } catch (error) {
        failure ??= error;
      }
    }
  }
  if (failure !== undefined) throw failure;
}

/** The emails of the harness users that exist for `runId`; for the cleanup test. */
export async function harnessUserEmails(
  runId: string,
  env: StackEnv = stackEnv(),
): Promise<string[]> {
  const response = await fetch(
    `${env.apiUrl}/auth/v1/admin/users?per_page=1000`,
    {
      headers: adminHeaders(env),
    },
  );
  if (!response.ok) throw new Error(`Listing users failed: ${response.status}`);
  const { users } = (await response.json()) as { users: { email?: string }[] };
  return users
    .map((user) => user.email ?? '')
    .filter((email) => email.startsWith(`harness-${runId}-`));
}
