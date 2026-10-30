/*
 * The disposable database stack the tests run against, read from the variables
 * `scripts/db-with-stack.mjs` sets (`pnpm --filter @synapcity/server-data
 * test:db` runs through it). Every address must be loopback: the harness
 * creates and deletes users, so it must never be pointed at a hosted project.
 */
export type StackEnv = {
  dbUrl: string;
  apiUrl: string;
  publishableKey: string;
  serviceKey: string;
};

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

function assertLoopback(label: string, value: string): void {
  let host: string;
  try {
    host = new URL(value).hostname;
  } catch {
    throw new Error(`${label} is not a URL.`);
  }
  if (!LOCAL_HOSTS.has(host)) {
    // The value itself is not printed: a database URL carries a password.
    throw new Error(`${label} is not a loopback address (${host}).`);
  }
}

export function stackEnv(
  env: Record<string, string | undefined> = process.env,
): StackEnv {
  const dbUrl = env.SUPABASE_DB_URL;
  const apiUrl = env.DB_TEST_API_URL;
  const publishableKey = env.DB_TEST_PUBLISHABLE_KEY;
  const serviceKey = env.DB_TEST_SERVICE_KEY;
  if (!dbUrl || !apiUrl || !publishableKey || !serviceKey) {
    throw new Error(
      'The database stack is not described. Run `pnpm --filter @synapcity/server-data test:db`, which starts from `pnpm db:stack start`.',
    );
  }
  assertLoopback('SUPABASE_DB_URL', dbUrl);
  assertLoopback('DB_TEST_API_URL', apiUrl);
  return { dbUrl, apiUrl, publishableKey, serviceKey };
}
