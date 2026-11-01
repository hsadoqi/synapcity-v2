// Runs the real scripts with a recording stand-in for `supabase`, `pnpm` and
// `psql` first on PATH. A refused target must exit 1 before any of them runs.
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const HOSTED =
  'postgresql://postgres:secret@db.abcdefghijklmnopqrst.supabase.co:5432/postgres';

let dir;
let marker;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'db-guards-'));
  marker = join(dir, 'spawned');
  for (const name of ['supabase', 'pnpm', 'psql']) {
    const file = join(dir, name);
    writeFileSync(file, `#!/bin/sh\necho "$0 $@" >> "${marker}"\nexit 0\n`);
    chmodSync(file, 0o755);
  }
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function run(script, args, env = {}) {
  return spawnSync(
    process.execPath,
    [join(import.meta.dirname, script), ...args],
    {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, ...env },
      encoding: 'utf8',
    },
  );
}

describe.each([
  ['db-types.mjs', 'db:types'],
  ['db-test.mjs', 'db:test'],
])('%s', (script, label) => {
  it('refuses a hosted --db-url before spawning anything', () => {
    const result = run(script, ['--db-url', HOSTED]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`${label}: Refusing a non-loopback`);
    expect(result.stderr).not.toContain('secret');
    expect(existsSync(marker)).toBe(false);
  });

  it('refuses a hosted SUPABASE_DB_URL before spawning anything', () => {
    const result = run(script, [], { SUPABASE_DB_URL: HOSTED });
    expect(result.status).toBe(1);
    expect(existsSync(marker)).toBe(false);
  });

  it('refuses a host smuggled through the query', () => {
    const result = run(script, [
      '--db-url',
      'postgresql://u:p@127.0.0.1/postgres?host=db.example.co',
    ]);
    expect(result.status).toBe(1);
    expect(existsSync(marker)).toBe(false);
  });
});

describe('db-types.mjs override', () => {
  it('refuses a hosted URL whose ref does not match the flag', () => {
    const result = run('db-types.mjs', [
      '--db-url',
      HOSTED,
      '--allow-remote-target',
      'zzzzzzzzzzzzzzzzzzzz',
    ]);
    expect(result.status).toBe(1);
    expect(existsSync(marker)).toBe(false);
  });
});

describe('db-test.mjs has no override', () => {
  it('ignores --allow-remote-target', () => {
    const result = run('db-test.mjs', [
      '--db-url',
      HOSTED,
      '--allow-remote-target',
      'abcdefghijklmnopqrst',
    ]);
    expect(result.status).toBe(1);
    expect(existsSync(marker)).toBe(false);
  });
});

describe('db-test.mjs on a loopback target', () => {
  it('reaches psql for each test file and stops at the first failure', () => {
    // Helper setup and teardown succeed; every test file fails.
    const failing = join(dir, 'psql');
    writeFileSync(
      failing,
      `#!/bin/sh\necho "$@" >> "${marker}"\ncase "$*" in *_helpers.sql*|*"drop schema"*) exit 0;; esac\nexit 3\n`,
    );
    chmodSync(failing, 0o755);
    const result = run('db-test.mjs', [
      '--db-url',
      'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    ]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('FAIL');
    expect(result.stdout).toContain('not run after the failure');
    // The helper schema is dropped even though a test failed.
    expect(readFileSync(marker, 'utf8')).toContain(
      'drop schema if exists test_helpers',
    );
  });
});
