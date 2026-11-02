// Loads the "demo-workbench" scenario into the local Supabase stack, so the app
// runs against a real database with a signed-in user and populated Spaces.
//
// It (1) deletes the demo user if a previous run made one, which cascades to
// everything they own, (2) creates the user through the Auth admin API so the
// signup triggers build their profile and preferences as a real signup does,
// and (3) inserts the scenario's Spaces, Documents, Dashboards and filings as
// the database administrator. Dashboard compositions come from the insert
// trigger. The scenario itself lives in @synapcity/dev-fixtures; its SQL is
// written by a gated Vitest file, because plain `node` cannot load the domain
// packages' TypeScript source.
//
// Local only: the database and API hosts are checked before anything connects.
// The password is random each run and printed once; nothing is stored.
//
// Usage: pnpm db:seed-demo   (needs a running stack: `supabase start`)
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertLocalTarget, TargetRefusedError } from './lib/loopback.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEMO_EMAIL = 'demo-workbench-a@synapcity.test';

function readStatus() {
  const output = execFileSync(
    'pnpm',
    ['exec', 'supabase', 'status', '-o', 'json'],
    {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  // The CLI may print warnings before the JSON object.
  return JSON.parse(output.slice(output.indexOf('{')));
}

function assertLocalApi(rawUrl) {
  const host = new URL(rawUrl).hostname;
  if (host !== '127.0.0.1' && host !== 'localhost') {
    throw new TargetRefusedError(`The API target "${host}" is not local.`);
  }
}

function psql(dbUrl, args) {
  const result = spawnSync(
    'psql',
    ['-X', '-q', '-v', 'ON_ERROR_STOP=1', ...args, dbUrl],
    {
      stdio: 'inherit',
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`psql exited with ${result.status}`);
}

async function main() {
  const status = readStatus();
  const {
    DB_URL: dbUrl,
    API_URL: apiUrl,
    SERVICE_ROLE_KEY: serviceKey,
  } = status;
  if (!dbUrl || !apiUrl || !serviceKey) {
    throw new Error(
      'supabase status did not report DB_URL, API_URL and SERVICE_ROLE_KEY',
    );
  }
  assertLocalTarget(dbUrl);
  assertLocalApi(apiUrl);

  const dir = mkdtempSync(join(tmpdir(), 'synapcity-demo-'));
  const sqlFile = join(dir, 'demo-workbench.sql');
  try {
    execFileSync(
      'pnpm',
      [
        '--filter',
        '@synapcity/dev-fixtures',
        'exec',
        'vitest',
        'run',
        'src/scenarios/demo-sql.test.ts',
      ],
      {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, SEED_DEMO_SQL: sqlFile },
      },
    );

    psql(dbUrl, ['-c', `delete from auth.users where email = '${DEMO_EMAIL}'`]);

    const password = randomBytes(12).toString('base64url');
    const response = await fetch(`${apiUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Ada Example' },
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Creating the demo user failed: ${response.status} ${await response.text()}`,
      );
    }
    const { id } = await response.json();

    psql(dbUrl, ['-v', `owner_id=${id}`, '-f', sqlFile]);

    process.stdout.write(
      `\nSeeded the demo-workbench scenario.\n  email:    ${DEMO_EMAIL}\n  password: ${password}\n`,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const refused = error instanceof TargetRefusedError;
  process.stderr.write(
    `db:seed-demo: ${error.message}${refused ? '' : '\nIs the local stack running? Start it with `supabase start`.'}\n`,
  );
  process.exit(1);
});
