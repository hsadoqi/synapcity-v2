import { describe, expect, it } from 'vitest';
import { assertReadOnlyCommand, assertReadOnlySql, run } from './db-parity.mjs';

const REF = 'abcdefghijklmnopqrst';
const LEDGER = `## Environments
| Environment | Project ref |
| --- | --- |
| production | \`${REF}\` |
| preview | — |
| local | local |
`;

const ALLOWLIST =
  '## Allowed differences\n| Difference | Reason |\n| --- | --- |\n| — | — |\n';

const ENTRIES = JSON.stringify({
  migrations: [
    { local: '20260101000000', remote: '20260101000000', time: 't' },
  ],
});
const DUMP =
  'CREATE TABLE "public"."t" (\n  "id" uuid\n);\nGRANT SELECT ON TABLE "public"."t" TO "authenticated";\n';

/** A recording stand-in for the Supabase CLI. */
function harness({
  linked = REF,
  dump = DUMP,
  targetDump = DUMP,
  policies = [],
  bucket = [],
  files = ['20260101000000_a.sql'],
} = {}) {
  const calls = [];
  const out = [];
  const err = [];
  const deps = {
    supabase: (args) => {
      assertReadOnlyCommand(args);
      calls.push(args);
      const linkedCall = args.includes('--linked');
      if (args[0] === 'migration') return `Connecting...\n${ENTRIES}`;
      if (args[0] === 'db' && args[1] === 'dump')
        return linkedCall ? targetDump : dump;
      if (args[0] === 'db' && args[1] === 'query') {
        return `Connecting...\n${JSON.stringify(args.at(-1).includes('pg_policies') ? policies : bucket)}`;
      }
      throw new Error('unexpected');
    },
    readFile: (p) =>
      p.endsWith('project-ref')
        ? `${linked}\n`
        : p.endsWith('allowlist.md')
          ? ALLOWLIST
          : LEDGER,
    exists: () => true,
    readdir: () => files,
    isolatedStack: () => ({
      dbUrl: 'postgresql://postgres:postgres@127.0.0.1:56221/postgres',
    }),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  };
  return { deps, calls, out, err };
}

describe('the expected project ref', () => {
  it.each([
    '--expected-ref',
    '--ref',
    '--project-ref',
    '--expected-project-ref',
  ])('refuses %s on the command line, running nothing', async (flag) => {
    const h = harness();
    const code = await run(
      ['--environment', 'production', flag, REF],
      {},
      h.deps,
    );
    expect(code).toBe(1);
    expect(h.calls).toEqual([]);
    expect(h.err.join('\n')).toContain(
      'comes only from the Environments table',
    );
  });

  it("refuses a linked project that is not the ledger's, before any command touches it", async () => {
    const h = harness({ linked: 'zzzzzzzzzzzzzzzzzzzz' });
    const code = await run(['--environment', 'production'], {}, h.deps);
    expect(code).toBe(1);
    expect(h.calls).toEqual([]);
    expect(h.out.join('\n')).toContain(REF);
    expect(h.out.join('\n')).toContain('zzzzzzzzzzzzzzzzzzzz');
  });

  it('refuses an environment the ledger gives no ref, and an unlinked checkout', async () => {
    const h = harness();
    expect(await run(['--environment', 'preview'], {}, h.deps)).toBe(1);
    expect(h.calls).toEqual([]);
    const unlinked = harness();
    unlinked.deps.exists = (p) => !p.endsWith('project-ref');
    expect(await run(['--environment', 'production'], {}, unlinked.deps)).toBe(
      1,
    );
    expect(unlinked.calls).toEqual([]);
  });

  it('needs an environment', async () => {
    const h = harness();
    expect(await run([], {}, h.deps)).toBe(2);
  });
});

describe('a matching linked project', () => {
  it('reads only, and reports no difference for equal schemas', async () => {
    const h = harness();
    const code = await run(['--environment', 'production'], {}, h.deps);
    expect(code).toBe(0);
    expect(h.out.join('\n')).toContain('RESULT: no actionable differences');
    // Every call is one of the three read-only commands.
    for (const args of h.calls) {
      expect(['migration list', 'db dump', 'db query']).toContain(
        `${args[0]} ${args[1]}`,
      );
    }
    const all = h.calls.flat().join(' ');
    for (const forbidden of ['push', 'repair', 'reset', 'apply', 'up']) {
      expect(all.split(' ')).not.toContain(forbidden);
    }
  });

  it('exits 1 on a grant difference and names it', async () => {
    const h = harness({
      targetDump: DUMP.replace('"authenticated"', '"anon"'),
    });
    expect(await run(['--environment', 'production'], {}, h.deps)).toBe(1);
    expect(h.out.join('\n')).toContain('ACTION');
  });

  it('exits 1 on a differing avatars bucket row', async () => {
    const reference = [
      {
        id: 'avatars',
        name: 'avatars',
        public: true,
        file_size_limit: 2097152,
        allowed_mime_types: ['image/png'],
      },
    ];
    const h = harness();
    const base = h.deps.supabase;
    h.deps.supabase = (args) => {
      if (args[1] === 'query' && args.at(-1).includes('storage.buckets')) {
        const row = args.includes('--linked')
          ? { ...reference[0], public: false }
          : reference[0];
        return JSON.stringify([row]);
      }
      return base(args);
    };
    expect(await run(['--environment', 'production'], {}, h.deps)).toBe(1);
    expect(h.out.join('\n')).toContain('storage bucket avatars.public');
  });

  it('stops with a format error, not a guess, when the CLI prints another shape', async () => {
    const h = harness();
    const base = h.deps.supabase;
    h.deps.supabase = (args) =>
      args[0] === 'migration' ? 'Local | Remote\n 1 | 1' : base(args);
    expect(await run(['--environment', 'production'], {}, h.deps)).toBe(2);
    expect(h.err.join('\n')).toContain('Report it instead of guessing');
  });

  it('checks that the pending set is exactly the train when asked', async () => {
    const h = harness();
    expect(
      await run(
        ['--environment', 'production', '--expect-pending', '20270101000000'],
        {},
        h.deps,
      ),
    ).toBe(1);
    expect(h.err.join('\n')).toContain('not exactly the train');
  });
});

describe('the local environment', () => {
  it('refuses a non-loopback target database', async () => {
    const h = harness();
    const code = await run(
      ['--environment', 'local'],
      {
        SYNAPCITY_PARITY_TARGET_DB_URL:
          'postgresql://u:p@db.abcdefghijklmnopqrst.supabase.co:5432/postgres',
      },
      h.deps,
    );
    expect(code).toBe(1);
    expect(h.calls).toEqual([]);
  });
});

describe('the read-only guards', () => {
  it('lets a SELECT through and refuses anything else', () => {
    expect(() => assertReadOnlySql('select 1 from pg_policies')).not.toThrow();
    for (const sql of [
      'delete from t',
      'select 1; drop table t',
      'update t set a = 1',
      'insert into t values (1)',
      'with x as (select 1) delete from t',
    ]) {
      expect(() => assertReadOnlySql(sql)).toThrow();
    }
  });

  it('allows only the three read-only CLI commands', () => {
    for (const args of [
      ['migration', 'list'],
      ['db', 'dump'],
      ['db', 'query'],
    ]) {
      expect(() => assertReadOnlyCommand(args)).not.toThrow();
    }
    for (const args of [
      ['db', 'push'],
      ['migration', 'repair'],
      ['db', 'reset'],
      ['migration', 'up'],
      ['link'],
      ['db', 'pull'],
    ]) {
      expect(() => assertReadOnlyCommand(args)).toThrow();
    }
  });
});
