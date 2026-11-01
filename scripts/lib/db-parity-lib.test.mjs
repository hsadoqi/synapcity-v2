import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FormatError,
  classifyDifferences,
  classifyLedger,
  compareBucket,
  comparePolicies,
  compareSchemas,
  expectedRefFor,
  normalizeStatements,
  parseAllowlist,
  parseLedgerEnvironments,
  parseMigrationList,
  splitStatements,
  statementKey,
} from './db-parity-lib.mjs';

// The real output of `supabase migration list --output-format json` (CLI 2.122.0)
// for a database with one pending migration and one version the files lack.
const MISMATCH = readFileSync(
  new URL('./fixtures/migration-list-mismatch.txt', import.meta.url),
  'utf8',
);

describe('the deployment ledger', () => {
  const ledger = [
    '# Ledger',
    '## Environments',
    '| Environment | Project ref | Reviewed |',
    '| ----------- | ----------- | -------- |',
    '| production | `abcdefghijklmnopqrst` | 2026-10-30 |',
    '| preview | — | |',
    '| local | local | |',
    '## Entries',
    '| Environment | Project ref |',
    '| x | zzzzzzzzzzzzzzzzzzzz |',
  ].join('\n');

  it('reads the Environments table only', () => {
    expect(parseLedgerEnvironments(ledger)).toEqual([
      { environment: 'production', ref: 'abcdefghijklmnopqrst' },
      { environment: 'preview', ref: '—' },
      { environment: 'local', ref: 'local' },
    ]);
  });

  it('gives the ref for an environment, and none for an unset or unknown one', () => {
    expect(expectedRefFor(ledger, 'production')).toBe('abcdefghijklmnopqrst');
    expect(expectedRefFor(ledger, 'preview')).toBeNull();
    expect(expectedRefFor(ledger, 'staging')).toBeNull();
  });

  it('stops when the table is missing or malformed', () => {
    expect(() => parseLedgerEnvironments('# nothing')).toThrow(FormatError);
    expect(() =>
      parseLedgerEnvironments('## Environments\n| A | B |\n| - | - |'),
    ).toThrow(FormatError);
  });
});

describe('migration list', () => {
  it('reads the CLI JSON, ignoring the line printed before it', () => {
    const entries = parseMigrationList(MISMATCH);
    expect(entries.length).toBeGreaterThan(10);
    expect(entries.find((e) => e.remote === '')).toMatchObject({
      local: '20261030065713',
    });
    expect(entries.find((e) => e.local === '')).toMatchObject({
      remote: '20990101000000',
    });
  });

  it('classifies both, local-only (pending) and remote-only (drift)', () => {
    const entries = parseMigrationList(MISMATCH);
    const files = entries.map((e) => e.local).filter(Boolean);
    const result = classifyLedger(entries, files);
    expect(result.localOnly).toEqual(['20261030065713']);
    expect(result.remoteOnly).toEqual(['20990101000000']);
    expect(result.both).toHaveLength(entries.length - 2);
    expect(result.filesNotReported).toEqual([]);
  });

  it('notices when the CLI does not report the files on this commit', () => {
    const result = classifyLedger([{ local: '1', remote: '1' }], ['1', '2']);
    expect(result.filesNotReported).toEqual(['2']);
    expect(
      classifyLedger([{ local: '9', remote: '9' }], ['1']).reportedNotFiles,
    ).toEqual(['9']);
  });

  it.each([
    ['no JSON', 'Connecting to remote database...\n  Local | Remote'],
    ['broken JSON', '{"migrations": [}'],
    ['no migrations array', '{"message":"ok"}'],
    ['an entry in another shape', '{"migrations":[{"version":"1"}]}'],
  ])('stops, rather than guessing, on %s', (_name, output) => {
    expect(() => parseMigrationList(output)).toThrow(FormatError);
  });
});

const DUMP_HEADER = `
SET statement_timeout = 0;
SET lock_timeout = 0;
SELECT pg_catalog.set_config('search_path', '', false);
SET row_security = off;

-- a comment that is noise
CREATE SCHEMA IF NOT EXISTS "private";
ALTER SCHEMA "private" OWNER TO "postgres";
`;

const FN = (
  body = 'select 1',
  extra = `SECURITY DEFINER\n    SET "search_path" TO ''`,
) => `
CREATE OR REPLACE FUNCTION "private"."f"() RETURNS integer
    LANGUAGE "sql" ${extra}
    AS $$
${body};
$$;
ALTER FUNCTION "private"."f"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "private"."f"() FROM PUBLIC;
`;

const TABLE = `
CREATE TABLE IF NOT EXISTS "public"."t" (
    "id" uuid NOT NULL
);
ALTER TABLE "public"."t" OWNER TO "postgres";
ALTER TABLE ONLY "public"."t"
    ADD CONSTRAINT "t_pkey" PRIMARY KEY ("id");
ALTER TABLE "public"."t" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "t_select" ON "public"."t" FOR SELECT TO "authenticated" USING (true);
GRANT SELECT ON TABLE "public"."t" TO "authenticated";
CREATE OR REPLACE TRIGGER "t_trg" BEFORE UPDATE ON "public"."t" FOR EACH ROW EXECUTE FUNCTION "private"."f"();
`;

describe('splitting a dump', () => {
  it('keeps a dollar-quoted body whole, even with semicolons inside', () => {
    const parts = splitStatements(FN('select 1;\nselect 2'));
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain('select 1;\nselect 2');
  });

  it('understands tagged dollar quotes', () => {
    const script =
      'CREATE FUNCTION "x"() RETURNS text LANGUAGE sql AS $body$\nselect \'$$ ;\' ;\n$body$;\nGRANT ALL ON x TO y;';
    expect(splitStatements(script)).toHaveLength(2);
  });
});

describe('normalization', () => {
  it('drops header settings, comments and ownership, and nothing else', () => {
    const kept = normalizeStatements(DUMP_HEADER + FN() + TABLE);
    expect(kept.some((s) => /^SET\b/.test(s))).toBe(false);
    expect(kept.some((s) => /OWNER TO/.test(s))).toBe(false);
    expect(kept.some((s) => s.startsWith('GRANT SELECT'))).toBe(true);
    expect(kept.some((s) => s.startsWith('CREATE POLICY'))).toBe(true);
    expect(kept.some((s) => s.startsWith('REVOKE ALL ON FUNCTION'))).toBe(true);
  });

  it('strips an extension version only', () => {
    expect(
      normalizeStatements(
        'CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions" VERSION "1.3";',
      )[0],
    ).toBe(
      'CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";',
    );
  });

  it('identifies each kind of object', () => {
    const kinds = normalizeStatements(FN() + TABLE).map(
      (s) => statementKey(s).type,
    );
    expect(kinds).toEqual([
      'function',
      'grant',
      'table',
      'constraint',
      'rls',
      'policy',
      'grant',
      'trigger',
    ]);
  });
});

describe('comparing schemas', () => {
  const same = DUMP_HEADER + FN() + TABLE;

  it('finds no difference between equal dumps, whatever the header, owner or spacing', () => {
    const other = same
      .replace('SET statement_timeout = 0;', 'SET statement_timeout = 1;')
      .replace(/OWNER TO "postgres"/g, 'OWNER TO "supabase_admin"')
      .replace(
        'CREATE TABLE IF NOT EXISTS "public"."t" (',
        'CREATE TABLE IF NOT EXISTS   "public"."t"   (',
      );
    expect(compareSchemas(same, other)).toEqual([]);
  });

  describe('never normalizes away the security surface', () => {
    const cases = [
      [
        'a grant that differs',
        same,
        same.replace(
          'GRANT SELECT ON TABLE "public"."t" TO "authenticated"',
          'GRANT SELECT ON TABLE "public"."t" TO "anon"',
        ),
        'grant',
      ],
      [
        'a missing grant',
        same,
        same.replace(
          'GRANT SELECT ON TABLE "public"."t" TO "authenticated";',
          '',
        ),
        'grant',
      ],
      [
        'a policy that differs',
        same,
        same.replace('USING (true)', 'USING (false)'),
        'policy',
      ],
      [
        'row-level security off',
        same,
        same.replace('ENABLE ROW LEVEL SECURITY', 'DISABLE ROW LEVEL SECURITY'),
        'rls',
      ],
      [
        'a function body that differs',
        same,
        same.replace('select 1;', 'select 2;'),
        'function',
      ],
      [
        'SECURITY DEFINER lost',
        same,
        same.replace('SECURITY DEFINER\n    ', ''),
        'function',
      ],
      [
        'search_path changed',
        same,
        same.replace(
          `SET "search_path" TO ''`,
          `SET "search_path" TO 'public'`,
        ),
        'function',
      ],
      [
        'search_path dropped',
        same,
        same.replace(`\n    SET "search_path" TO ''`, ''),
        'function',
      ],
      [
        'a trigger that differs',
        same,
        same.replace('BEFORE UPDATE', 'AFTER UPDATE'),
        'trigger',
      ],
      [
        'a revoke that is missing',
        same,
        same.replace('REVOKE ALL ON FUNCTION "private"."f"() FROM PUBLIC;', ''),
        'grant',
      ],
    ];
    it.each(cases)('reports %s', (_name, reference, target, type) => {
      const differences = compareSchemas(reference, target);
      expect(differences.length).toBeGreaterThan(0);
      expect(differences.some((d) => d.type === type)).toBe(true);
    });
  });

  it('tells what the target lacks from what it has extra', () => {
    const missing = compareSchemas(same, DUMP_HEADER + TABLE);
    expect(missing.map((d) => d.kind)).toContain('reference-only');
    const extra = compareSchemas(DUMP_HEADER + TABLE, same);
    expect(extra.map((d) => d.kind)).toContain('target-only');
  });
});

describe('storage', () => {
  const policy = {
    policyname: 'p',
    permissive: 'PERMISSIVE',
    roles: ['authenticated'],
    cmd: 'SELECT',
    qual: "(bucket_id = 'avatars')",
    with_check: null,
  };

  it('compares policies by definition, ignoring only whitespace', () => {
    expect(
      comparePolicies(
        [policy],
        [{ ...policy, qual: "(bucket_id   =  'avatars')" }],
      ),
    ).toEqual([]);
    expect(
      comparePolicies([policy], [{ ...policy, qual: 'true' }])[0],
    ).toMatchObject({ kind: 'changed' });
    expect(comparePolicies([policy], [])[0]).toMatchObject({
      kind: 'reference-only',
    });
    expect(comparePolicies([], [policy])[0]).toMatchObject({
      kind: 'target-only',
    });
    expect(
      comparePolicies([policy], [{ ...policy, roles: ['anon'] }])[0],
    ).toMatchObject({ kind: 'changed' });
  });

  const bucket = {
    id: 'avatars',
    name: 'avatars',
    public: true,
    file_size_limit: 2097152,
    allowed_mime_types: ['image/png', 'image/jpeg', 'image/webp'],
  };

  it('compares the avatars bucket row field by field', () => {
    expect(
      compareBucket(bucket, {
        ...bucket,
        allowed_mime_types: ['image/webp', 'image/png', 'image/jpeg'],
      }),
    ).toEqual([]);
    expect(compareBucket(bucket, { ...bucket, public: false })).toMatchObject([
      { key: 'storage bucket avatars.public', kind: 'changed' },
    ]);
    expect(
      compareBucket(bucket, {
        ...bucket,
        allowed_mime_types: [...bucket.allowed_mime_types, 'image/svg+xml'],
      }),
    ).toMatchObject([{ key: 'storage bucket avatars.allowed_mime_types' }]);
    expect(
      compareBucket(bucket, { ...bucket, file_size_limit: 1 }),
    ).toHaveLength(1);
    expect(compareBucket(bucket, null)[0]).toMatchObject({
      kind: 'reference-only',
    });
    expect(compareBucket(null, bucket)[0]).toMatchObject({
      kind: 'target-only',
    });
    expect(compareBucket(null, null)).toEqual([]);
  });
});

describe('the allowlist', () => {
  const md =
    '## Allowed differences\n| Difference | Reason |\n| --- | --- |\n| `storage policy x` | Supabase-managed |\n| — | — |';

  it('reads keys with reasons and classifies differences by them', () => {
    const allow = parseAllowlist(md);
    const { expected, actionable } = classifyDifferences(
      [
        { key: 'storage policy x', kind: 'target-only' },
        { key: 'grant y', kind: 'changed' },
      ],
      allow,
    );
    expect(expected).toMatchObject([
      { key: 'storage policy x', reason: 'Supabase-managed' },
    ]);
    expect(actionable).toMatchObject([{ key: 'grant y' }]);
  });

  it('refuses an entry without a reason', () => {
    expect(() =>
      parseAllowlist(
        '## Allowed differences\n| Difference | Reason |\n| - | - |\n| `a` | |',
      ),
    ).toThrow(FormatError);
  });
});
