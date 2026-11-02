// Runs the signed-in checks against the local Supabase stack and a web server
// that this run builds from its own checkout, starts and stops itself. Nothing
// is attached to: if something already answers on the stack's site_url the run
// fails. Keys are read from the Supabase CLI into this process's environment
// and never printed. See e2e/support/local-session.ts for the rules.
import { execFileSync, spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { removeTemporaryUsers } from './support/local-stack.ts';
import {
  LockHeldError,
  acquireLock,
  hasListener,
  siteOriginFrom,
  startServer,
  stopServer,
  waitForBuild,
} from './support/local-session.ts';

const appDir = fileURLToPath(new URL('..', import.meta.url));
const root = fileURLToPath(new URL('../../..', import.meta.url));
// Inside .next so every existing ignore rule already covers it, and a normal
// `pnpm build` (which clears .next) never serves it by accident.
const DIST_DIR = '.next/local-session';
const START_TIMEOUT_MS = 60_000;
// The directory whose supabase/ folder names the stack to use. By default this
// checkout's own; `E2E_STACK_WORKDIR` points the run at another one, such as
// the worktree's disposable stack (`pnpm db:stack start`, whose copy of
// config.toml and migrations live under its `work` directory). The address
// checks in support/local-stack.ts still refuse anything that is not loopback.
const STACK_DIR =
  process.env.E2E_STACK_WORKDIR === undefined
    ? root
    : process.env.E2E_STACK_WORKDIR;
// A variable that is set but empty (a failed command substitution) must not
// quietly mean "the default stack", which another checkout may be using.
if (!STACK_DIR) {
  throw new Error(
    'E2E_STACK_WORKDIR is set but empty; unset it or give a directory.',
  );
}
// A user older than this belongs to a run that died, not to one in progress.
const LEFTOVER_AGE_MS = 15 * 60_000;
// The stack stamps users with its own clock, which can trail this one.
const CLOCK_SKEW_MS = 5_000;
const log = (message) => console.log(`[local-session] ${message}`);

let interrupted = null;
let running = null;
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    interrupted = signal;
    running?.kill(signal);
  });
}

/** Runs a command to completion in this app, forwarding an interrupt to it. */
function run(command, args, env) {
  return new Promise((resolve, reject) => {
    running = spawn(command, args, { cwd: appDir, stdio: 'inherit', env });
    running.once('error', reject);
    running.once('exit', (code, signal) => {
      running = null;
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

function stackValues() {
  const status = execFileSync(
    'supabase',
    ['status', '-o', 'env', '--workdir', STACK_DIR],
    { stdio: ['ignore', 'pipe', 'ignore'] },
  ).toString();
  return Object.fromEntries(
    status
      .split('\n')
      .filter((line) => line.includes('='))
      .map((line) => {
        const at = line.indexOf('=');
        return [line.slice(0, at), line.slice(at + 1).replace(/^"|"$/g, '')];
      }),
  );
}

async function main() {
  const values = stackValues();
  const stack = {
    apiUrl: values.API_URL,
    serviceKey: values.SERVICE_ROLE_KEY,
    mailUrl: values.MAILPIT_URL,
  };
  const publishableKey = values.PUBLISHABLE_KEY ?? values.ANON_KEY;
  const origin = siteOriginFrom(
    readFileSync(join(STACK_DIR, 'supabase', 'config.toml'), 'utf8'),
  );

  const runStart = Date.now();
  const release = acquireLock(stack.apiUrl, root);
  let server = null;
  try {
    if (await hasListener(Number(origin.port))) {
      throw new Error(
        `${origin.origin} already has a listener, and this run starts its own server there ` +
          `(the stack sends sign-in links to that address). Find it with ` +
          `\`lsof -nP -iTCP:${origin.port} -sTCP:LISTEN\` and stop it.`,
      );
    }
    const removedBefore = await removeTemporaryUsers(
      stack,
      (createdAt) => runStart - createdAt > LEFTOVER_AGE_MS,
    );
    if (removedBefore)
      log(`removed ${removedBefore} leftover temporary user(s)`);

    // The Supabase address is inlined into the browser bundle at build time,
    // so the build is made here, against this stack, every run.
    const appEnv = {
      ...process.env,
      NEXT_DIST_DIR: DIST_DIR,
      NEXT_PUBLIC_SUPABASE_URL: stack.apiUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      SITE_URL: origin.origin,
    };
    log(`building ${appDir} against ${stack.apiUrl}`);
    const built = await run('pnpm', ['exec', 'next', 'build'], appEnv);
    if (interrupted) return;
    if (built !== 0) throw new Error(`next build exited with ${built}.`);
    const buildId = readFileSync(
      join(appDir, DIST_DIR, 'BUILD_ID'),
      'utf8',
    ).trim();

    server = startServer({
      cwd: appDir,
      origin,
      distDir: DIST_DIR,
      env: appEnv,
    });
    await waitForBuild({
      server,
      origin,
      buildId,
      timeoutMs: START_TIMEOUT_MS,
    });
    log(
      `web: ${origin.origin} (pid ${server.child.pid}, checkout ${root}, build ${buildId})`,
    );

    const code = await run(
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
        ...process.env,
        SYNAPCITY_E2E_LOCAL_AUTH: '1',
        E2E_BASE_URL: origin.origin,
        E2E_API_URL: stack.apiUrl,
        E2E_SERVICE_KEY: stack.serviceKey,
        E2E_MAIL_URL: stack.mailUrl,
      },
    );
    process.exitCode = interrupted ? 1 : code;
  } finally {
    if (server) await stopServer(server);
    try {
      const removedAfter = await removeTemporaryUsers(
        stack,
        (createdAt) => createdAt >= runStart - CLOCK_SKEW_MS,
      );
      if (removedAfter)
        log(`removed ${removedAfter} temporary user(s) left by this run`);
    } catch (error) {
      log(`cleanup of temporary users failed: ${error.message}`);
    }
    release();
  }
}

try {
  await main();
} catch (error) {
  console.error(
    error instanceof LockHeldError
      ? error.message
      : `[local-session] ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 1;
}
if (interrupted) process.exitCode = 1;
