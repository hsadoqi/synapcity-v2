import { describe, expect, it } from 'vitest';
import {
  assertLocalTarget,
  flagValue,
  projectRefOf,
  redactUrl,
  TargetRefusedError,
} from './loopback.mjs';

const REF = 'abcdefghijklmnopqrst';
const HOSTED = `postgresql://postgres:secret@db.${REF}.supabase.co:5432/postgres`;
const POOLED = `postgresql://postgres.${REF}:secret@aws-0-eu.pooler.supabase.com:6543/postgres`;

describe('assertLocalTarget', () => {
  it.each([
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=disable',
    'postgresql://postgres:postgres@localhost:54322/postgres',
    'postgres://u@127.0.0.1/db',
  ])('accepts the loopback target %s', (url) => {
    expect(assertLocalTarget(url)).toEqual({ remote: false, ref: null });
  });

  it.each([
    ['a hosted direct URL', HOSTED],
    ['a pooler URL', POOLED],
    [
      'a loopback name used as the user',
      'postgresql://127.0.0.1@db.example.co/postgres',
    ],
    [
      'a loopback name used as the password',
      'postgresql://u:127.0.0.1@db.example.co/postgres',
    ],
    [
      'a loopback-looking subdomain',
      'postgresql://u:p@127.0.0.1.example.co/postgres',
    ],
    [
      'localhost as a subdomain',
      'postgresql://u:p@localhost.example.co/postgres',
    ],
    [
      'a host replaced in the query',
      'postgresql://u:p@127.0.0.1/postgres?host=db.example.co',
    ],
    [
      'hostaddr in the query',
      'postgresql://u:p@127.0.0.1/postgres?hostaddr=203.0.113.9',
    ],
    [
      'a service file in the query',
      'postgresql://u:p@127.0.0.1/postgres?service=prod',
    ],
    ['several hosts', 'postgresql://u:p@127.0.0.1:1,db.example.co:2/postgres'],
    ['a key=value string', 'host=db.example.co dbname=postgres'],
    ['another scheme', 'https://127.0.0.1/postgres'],
    ['an empty string', ''],
  ])('refuses %s', (_name, url) => {
    expect(() => assertLocalTarget(url)).toThrow(TargetRefusedError);
  });

  it('accepts a hosted target only with a matching project ref', () => {
    expect(assertLocalTarget(HOSTED, { allowRemoteTarget: REF })).toEqual({
      remote: true,
      ref: REF,
    });
    expect(assertLocalTarget(POOLED, { allowRemoteTarget: REF }).remote).toBe(
      true,
    );
  });

  it.each([
    ['a different ref', 'zzzzzzzzzzzzzzzzzzzz'],
    ['a malformed ref', 'prod'],
  ])('refuses a hosted target with %s', (_name, ref) => {
    expect(() => assertLocalTarget(HOSTED, { allowRemoteTarget: ref })).toThrow(
      TargetRefusedError,
    );
  });

  it('refuses a remote target that names no project ref, even with a flag', () => {
    expect(() =>
      assertLocalTarget('postgresql://u:p@db.example.co/postgres', {
        allowRemoteTarget: REF,
      }),
    ).toThrow(TargetRefusedError);
  });

  it('never puts the password in a message', () => {
    try {
      assertLocalTarget(HOSTED);
    } catch (error) {
      expect(error.message).not.toContain('secret');
    }
    expect(redactUrl(HOSTED)).not.toContain('secret');
    expect(redactUrl(HOSTED)).not.toContain('postgres:');
  });
});

describe('projectRefOf', () => {
  it('reads the ref from direct and pooler URLs, and null from others', () => {
    expect(projectRefOf(HOSTED)).toBe(REF);
    expect(projectRefOf(POOLED)).toBe(REF);
    expect(projectRefOf('postgresql://u:p@127.0.0.1/postgres')).toBeNull();
  });
});

describe('flagValue', () => {
  it('reads both spellings and returns undefined when absent', () => {
    expect(flagValue(['--db-url', 'x'], 'db-url')).toBe('x');
    expect(flagValue(['--db-url=y'], 'db-url')).toBe('y');
    expect(flagValue(['--other'], 'db-url')).toBeUndefined();
  });
});
