/*
 * Helpers for the signed-in checks that run against the local Supabase stack
 * (`pnpm test:e2e:local-session`). They only ever talk to a loopback address,
 * create one clearly named temporary user, and remove only that user and the
 * mail sent to it. Nothing here logs a key or a password.
 */
import { randomBytes } from 'node:crypto';

// These variables are set by the local-session runner for one run. They are
// not inputs to any Turborepo task, so they are deliberately not declared.
/* eslint-disable turbo/no-undeclared-env-vars */

export type LocalStack = {
  apiUrl: string;
  serviceKey: string;
  mailUrl: string;
};

export type TemporaryUser = { id: string; email: string; password: string };

const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

/** The local stack named by the runner's environment, or null when the run is not opted in. */
export function localStack(): LocalStack | null {
  if (process.env.SYNAPCITY_E2E_LOCAL_AUTH !== '1') return null;
  const { E2E_API_URL, E2E_SERVICE_KEY, E2E_MAIL_URL } = process.env;
  if (!E2E_API_URL || !E2E_SERVICE_KEY || !E2E_MAIL_URL) {
    throw new Error('The local-session runner did not provide the stack.');
  }
  for (const url of [E2E_API_URL, E2E_MAIL_URL]) {
    // A hosted project must never be written to by this suite.
    if (!LOOPBACK.test(url)) throw new Error(`Not a loopback address: ${url}`);
  }
  return {
    apiUrl: E2E_API_URL,
    serviceKey: E2E_SERVICE_KEY,
    mailUrl: E2E_MAIL_URL,
  };
}

const admin = (stack: LocalStack) => ({
  apikey: stack.serviceKey,
  Authorization: `Bearer ${stack.serviceKey}`,
  'content-type': 'application/json',
});

export async function createTemporaryUser(
  stack: LocalStack,
): Promise<TemporaryUser> {
  const tag = randomBytes(4).toString('hex');
  const email = `route-groups-e2e-${Date.now()}-${tag}@example.test`;
  const password = `Aa1!${randomBytes(9).toString('base64url')}`;
  const response = await fetch(`${stack.apiUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: admin(stack),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Route Groups E2E' },
    }),
  });
  if (!response.ok)
    throw new Error(`Creating the user failed: ${response.status}`);
  const { id } = (await response.json()) as { id: string };
  return { id, email, password };
}

/** Removes the user (and, by cascade, what it owns) and the mail sent to it. */
export async function removeTemporaryUser(
  stack: LocalStack,
  user: TemporaryUser,
): Promise<void> {
  await fetch(
    `${stack.mailUrl}/api/v1/search?query=${encodeURIComponent(`to:${user.email}`)}`,
    { method: 'DELETE' },
  );
  const response = await fetch(
    `${stack.apiUrl}/auth/v1/admin/users/${user.id}`,
    {
      method: 'DELETE',
      headers: admin(stack),
    },
  );
  if (!response.ok)
    throw new Error(`Removing the user failed: ${response.status}`);
}

/** The link in the newest mail sent to the address, waiting briefly for it to arrive. */
export async function newestLinkTo(
  stack: LocalStack,
  email: string,
  after = 0,
): Promise<string> {
  const search = `${stack.mailUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`;
  for (let attempt = 0; attempt < 30; attempt++) {
    const { messages = [] } = (await (await fetch(search)).json()) as {
      messages?: { ID: string; Created: string }[];
    };
    const fresh = messages.filter((m) => Date.parse(m.Created) > after);
    if (fresh[0]) {
      const { Text } = (await (
        await fetch(`${stack.mailUrl}/api/v1/message/${fresh[0].ID}`)
      ).json()) as { Text: string };
      const link = Text.match(
        /https?:\/\/[^\s"<>)]+\/auth\/v1\/verify[^\s"<>)]*/,
      );
      if (link) return link[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('No sign-in link arrived in the local mailbox.');
}
