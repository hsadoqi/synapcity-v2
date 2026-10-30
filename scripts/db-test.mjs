// Runs every SQL test in supabase/tests against a local database.
//
// Each `supabase/tests/*.sql` file runs in name order with
// `psql -X -v ON_ERROR_STOP=1 -f <file>`. The files use plain SQL and
// `raise exception`, run inside a transaction that rolls back, and need no
// extension. The run stops at the first failing file and exits non-zero, so CI
// cannot pass with a failed assertion. Files whose name starts with `_` are
// support files, not tests.
//
// The database comes from `--db-url`, or SUPABASE_DB_URL, or else this
// worktree's disposable stack (`pnpm db:stack start`), or else
// `supabase status -o json` (`DB_URL`) for the stack in this checkout. The
// target must be on 127.0.0.1 or localhost; there is no override for tests,
// because they create their own users in the target.
//
// `supabase/tests/_helpers.sql` is loaded first (the `test_helpers` schema) and
// dropped at the end, even after a failure. On the worktree's own stack the run
// holds a lock, so two runs in one worktree cannot share its containers.
//
// Usage: pnpm db:test [--db-url <url>] [--workdir <dir containing supabase/>]
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  assertLocalTarget,
  flagValue,
  redactUrl,
  TargetRefusedError,
} from './lib/loopback.mjs';
import { acquireStackLock, StackLockHeldError } from './lib/stack-lock.mjs';
import {
  stackDirectory,
  status as isolatedStackStatus,
  worktreeId,
} from './db-test-stack.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The test files in `dir`, in name order; support files (`_*.sql`) are left out. */
export function listTestFiles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql') && !name.startsWith('_'))
    .sort()
    .map((name) => join(dir, name));
}

/**
 * The database URL for this run, before the loopback check, and whether it is
 * this worktree's own disposable stack (which the run then locks).
 */
export function resolveDbUrl(argv, env, { isolated, statusReader }) {
  const explicit = flagValue(argv, 'db-url') ?? env.SUPABASE_DB_URL;
  if (explicit) return { url: explicit, ownStack: false };
  const own = isolated();
  if (own) return { url: own.dbUrl, ownStack: true };
  return { url: statusReader(argv), ownStack: false };
}

function readStatusDbUrl(argv) {
  const workdir = flagValue(argv, 'workdir');
  const args = ['exec', 'supabase', 'status', '-o', 'json'];
  if (workdir) args.push('--workdir', workdir);
  const output = execFileSync('pnpm', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // The CLI may print warnings before the JSON object.
  const start = output.indexOf('{');
  const status = JSON.parse(output.slice(start));
  if (typeof status.DB_URL !== 'string') {
    throw new Error('supabase status did not report DB_URL');
  }
  return status.DB_URL;
}

/** Runs one file. Returns the exit status; output goes to this process's streams. */
export function runSqlFile(dbUrl, file) {
  const result = spawnSync(
    'psql',
    ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-f', file, dbUrl],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/** Runs one statement. Returns the exit status. */
function runSqlCommand(dbUrl, sql) {
  const result = spawnSync(
    'psql',
    ['-X', '-q', '-v', 'ON_ERROR_STOP=1', '-c', sql, dbUrl],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function main() {
  const argv = process.argv.slice(2);
  let target;
  try {
    target = resolveDbUrl(argv, process.env, {
      isolated: isolatedStackStatus,
      statusReader: readStatusDbUrl,
    });
    assertLocalTarget(target.url);
  } catch (error) {
    if (error instanceof TargetRefusedError) {
      process.stderr.write(`db:test: ${error.message}\n`);
    } else {
      process.stderr.write(
        `db:test: could not resolve the local database (${error.message}). ` +
          'Start one with `pnpm db:stack start`.\n',
      );
    }
    process.exit(1);
  }
  const dbUrl = target.url;

  let release = () => {};
  if (target.ownStack) {
    try {
      release = acquireStackLock(stackDirectory(worktreeId(root)));
    } catch (error) {
      if (!(error instanceof StackLockHeldError)) throw error;
      process.stderr.write(`db:test: ${error.message}\n`);
      process.exit(1);
    }
  }

  const testsDir = join(root, 'supabase/tests');
  const files = listTestFiles(testsDir);
  if (files.length === 0) {
    release();
    process.stderr.write('db:test: no SQL tests found.\n');
    process.exit(1);
  }
  console.log(`db:test: ${files.length} files against ${redactUrl(dbUrl)}`);

  const results = [];
  let failed = false;
  try {
    if (runSqlFile(dbUrl, join(testsDir, '_helpers.sql')) !== 0) {
      console.error('db:test: the helper schema could not be created.');
      failed = true;
    }
    for (const file of failed ? [] : files) {
      const name = file.slice(root.length + 1);
      console.log(`\n--- ${name}`);
      const status = runSqlFile(dbUrl, file);
      results.push({ name, ok: status === 0 });
      if (status !== 0) {
        failed = true;
        break;
      }
    }
  } finally {
    // Always removed, so a failed run leaves no helper functions behind.
    runSqlCommand(dbUrl, 'drop schema if exists test_helpers cascade');
    release();
  }

  console.log('\ndb:test summary');
  for (const { name, ok } of results)
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  const skipped = files.length - results.length;
  if (skipped > 0)
    console.log(`  ${skipped} file(s) not run after the failure`);
  process.exit(failed ? 1 : 0);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
