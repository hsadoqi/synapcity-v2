// Runs a command with this worktree's disposable database stack described in
// its environment, holding the stack's run lock for the duration. The two-user
// tests (`pnpm --filter @synapcity/server-data test:db`) run through it, so the
// TypeScript harness only reads variables and never shells out.
//
// Variables set for the command:
//   SUPABASE_DB_URL, DB_TEST_API_URL, DB_TEST_PUBLISHABLE_KEY, DB_TEST_SERVICE_KEY
// They come from the running stack (`pnpm db:stack start`), or from the same
// variables when all four are already set (CI, another local stack). Every
// address must be loopback.
//
// Usage: node scripts/db-with-stack.mjs -- <command> [args...]
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertLocalTarget, TargetRefusedError } from './lib/loopback.mjs';
import { acquireStackLock, StackLockHeldError } from './lib/stack-lock.mjs';
import {
  stackDirectory,
  status as isolatedStackStatus,
  worktreeId,
} from './db-test-stack.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const NAMES = [
  'SUPABASE_DB_URL',
  'DB_TEST_API_URL',
  'DB_TEST_PUBLISHABLE_KEY',
  'DB_TEST_SERVICE_KEY',
];

/** The four variables for a command, and whether they describe this worktree's own stack. */
export function resolveStackEnv(env, isolated) {
  if (NAMES.every((name) => env[name])) {
    return {
      vars: Object.fromEntries(NAMES.map((n) => [n, env[n]])),
      ownStack: false,
    };
  }
  const stack = isolated();
  if (!stack) {
    throw new Error(
      'no database stack is running (start one with `pnpm db:stack start`)',
    );
  }
  return {
    vars: {
      SUPABASE_DB_URL: stack.dbUrl,
      DB_TEST_API_URL: stack.apiUrl,
      DB_TEST_PUBLISHABLE_KEY: stack.publishableKey,
      DB_TEST_SERVICE_KEY: stack.serviceKey,
    },
    ownStack: true,
  };
}

function main() {
  const separator = process.argv.indexOf('--');
  const command = separator === -1 ? [] : process.argv.slice(separator + 1);
  if (command.length === 0) {
    process.stderr.write('usage: db-with-stack.mjs -- <command> [args...]\n');
    process.exit(2);
  }

  let resolved;
  try {
    resolved = resolveStackEnv(process.env, isolatedStackStatus);
    assertLocalTarget(resolved.vars.SUPABASE_DB_URL);
    // The API address goes through the same host check.
    assertLocalTarget(
      `postgresql://u@${new URL(resolved.vars.DB_TEST_API_URL).host}/x`,
    );
  } catch (error) {
    process.stderr.write(
      `db-with-stack: ${error instanceof TargetRefusedError ? error.message : `could not resolve the stack (${error.message})`}\n`,
    );
    process.exit(1);
  }

  let release = () => {};
  if (resolved.ownStack) {
    try {
      release = acquireStackLock(stackDirectory(worktreeId(root)));
    } catch (error) {
      if (!(error instanceof StackLockHeldError)) throw error;
      process.stderr.write(`db-with-stack: ${error.message}\n`);
      process.exit(1);
    }
  }

  const child = spawn(command[0], command.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, ...resolved.vars },
  });
  const forward = (signal) => child.kill(signal);
  process.on('SIGINT', forward);
  process.on('SIGTERM', forward);
  child.on('exit', (code, signal) => {
    release();
    process.exit(code ?? (signal ? 1 : 0));
  });
  child.on('error', (error) => {
    release();
    process.stderr.write(`db-with-stack: ${error.message}\n`);
    process.exit(1);
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
