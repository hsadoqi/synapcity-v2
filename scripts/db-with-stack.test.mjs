import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveStackEnv } from './db-with-stack.mjs';

const script = join(import.meta.dirname, 'db-with-stack.mjs');
const FULL = {
  SUPABASE_DB_URL: 'postgresql://postgres:postgres@127.0.0.1:56221/postgres',
  DB_TEST_API_URL: 'http://127.0.0.1:56220',
  DB_TEST_PUBLISHABLE_KEY: 'pk',
  DB_TEST_SERVICE_KEY: 'sk',
};

describe('resolveStackEnv', () => {
  it('uses the four variables when all are set, without touching a stack', () => {
    const result = resolveStackEnv(FULL, () => {
      throw new Error('must not look for a stack');
    });
    expect(result).toEqual({ vars: FULL, ownStack: false });
  });

  it('falls back to the worktree stack, and says so', () => {
    const result = resolveStackEnv(
      { SUPABASE_DB_URL: FULL.SUPABASE_DB_URL },
      () => ({
        dbUrl: 'postgresql://postgres:postgres@127.0.0.1:1/postgres',
        apiUrl: 'http://127.0.0.1:2',
        publishableKey: 'p',
        serviceKey: 's',
      }),
    );
    expect(result.ownStack).toBe(true);
    expect(result.vars.DB_TEST_API_URL).toBe('http://127.0.0.1:2');
  });

  it('throws when nothing is running', () => {
    expect(() => resolveStackEnv({}, () => null)).toThrow(/no database stack/);
  });
});

describe('db-with-stack.mjs', () => {
  const run = (env) =>
    spawnSync(
      process.execPath,
      [
        script,
        '--',
        process.execPath,
        '-e',
        'console.log(process.env.SUPABASE_DB_URL)',
      ],
      {
        env: { PATH: process.env.PATH, ...env },
        encoding: 'utf8',
      },
    );

  it('refuses a hosted database URL before running the command', () => {
    const result = run({
      ...FULL,
      SUPABASE_DB_URL:
        'postgresql://u:p@db.abcdefghijklmnopqrst.supabase.co:5432/postgres',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
  });

  it('refuses a hosted API URL', () => {
    const result = run({
      ...FULL,
      DB_TEST_API_URL: 'https://abcdefghijklmnopqrst.supabase.co',
    });
    expect(result.status).toBe(1);
    expect(result.stdout).toBe('');
  });

  it('runs the command with the variables for a loopback stack', () => {
    const result = run(FULL);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(FULL.SUPABASE_DB_URL);
  });

  it('passes the command exit code through', () => {
    const result = spawnSync(
      process.execPath,
      [script, '--', process.execPath, '-e', 'process.exit(7)'],
      {
        env: { PATH: process.env.PATH, ...FULL },
      },
    );
    expect(result.status).toBe(7);
  });
});
