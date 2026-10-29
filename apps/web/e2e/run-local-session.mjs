// Runs the signed-in checks against the local Supabase stack and a web server
// that is already running on E2E_BASE_URL (default http://127.0.0.1:3000),
// built with NEXT_PUBLIC_SUPABASE_URL pointing at that stack. Keys are read
// from the Supabase CLI into this process's environment and never printed.
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const status = execFileSync(
  'supabase',
  ['status', '-o', 'env', '--workdir', root],
  {
    stdio: ['ignore', 'pipe', 'ignore'],
  },
).toString();
const values = Object.fromEntries(
  status
    .split('\n')
    .filter((line) => line.includes('='))
    .map((line) => {
      const at = line.indexOf('=');
      return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')];
    }),
);

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'playwright',
    'test',
    '--config',
    'playwright.local-session.config.ts',
    ...process.argv.slice(2),
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      SYNAPCITY_E2E_LOCAL_AUTH: '1',
      E2E_API_URL: values.API_URL,
      E2E_SERVICE_KEY: values.SERVICE_ROLE_KEY,
      E2E_MAIL_URL: values.MAILPIT_URL,
    },
  },
);
process.exit(result.status ?? 1);
