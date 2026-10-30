// Compares a target database with what this checkout's migrations produce, and
// only reads. It is the operator's tool for the release procedure
// (docs/engineering/database-release.md); an agent may run it against a local
// target, and a hosted run is the owner's action.
//
// Three read-only comparisons:
//   1. Ledger: the migration files on this commit against the target's applied
//      migrations (`both`, `local-only` = pending deploy, `remote-only` = drift).
//   2. Schema: `public` and `private`, dumped from the target and from a fresh
//      local stack built from the migrations, statement by statement. Grants,
//      policies, function bodies, SECURITY DEFINER and search_path are never
//      normalized away.
//   3. Storage: the policies on storage.objects and the `avatars` bucket row,
//      by fixed catalog queries (configuration only; no object is read).
//
// The expected project ref comes only from the owner-reviewed Environments table
// of the deployment ledger. A ref typed on the command line is refused, and a
// linked project that does not match is refused before any command that
// touches it. The script never runs `db push`, `migration repair`, `db reset`
// or anything that writes, and never reads table rows.
//
// Usage: node scripts/db-parity.mjs --environment <name> [--expect-pending <v1,v2,...>]
// Exit: 0 clean, 1 an actionable difference or a refused target, 2 bad usage or an
// unexpected CLI output format.
//
// For tests only, and never as a flag: the environment variables
// SYNAPCITY_PARITY_LEDGER, SYNAPCITY_PARITY_ALLOWLIST and
// SYNAPCITY_PARITY_TARGET_DB_URL (loopback only, environment `local` only).
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { status as isolatedStackStatus } from './db-test-stack.mjs';
import {
  FormatError,
  classifyDifferences,
  classifyLedger,
  compareBucket,
  comparePolicies,
  compareSchemas,
  expectedRefFor,
  parseAllowlist,
  parseMigrationList,
} from './lib/db-parity-lib.mjs';
import {
  assertLocalTarget,
  flagValue,
  redactUrl,
  TargetRefusedError,
} from './lib/loopback.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const LEDGER = 'docs/engineering/database-deployment-ledger.md';
const ALLOWLIST = 'docs/engineering/database-parity-allowlist.md';

// A ref is never taken from the command line.
const REF_FLAGS = [
  '--expected-ref',
  '--ref',
  '--project-ref',
  '--expected-project-ref',
];

// The only CLI commands this script may run, and the fixed SELECTs it may send.
const READ_ONLY_COMMANDS = [
  ['migration', 'list'],
  ['db', 'dump'],
  ['db', 'query'],
];
const POLICY_SQL = `select policyname, permissive, roles, cmd, qual, with_check from pg_policies where schemaname = 'storage' and tablename = 'objects' order by policyname`;
const BUCKET_SQL = `select id, name, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'`;

/** Refuses anything but a single read-only SELECT. */
export function assertReadOnlySql(sql) {
  if (!/^select\b/i.test(sql.trim()) || sql.includes(';')) {
    throw new Error('db-parity only sends single SELECT statements.');
  }
}

/** Refuses any CLI call that is not one of the read-only commands. */
export function assertReadOnlyCommand(args) {
  const ok = READ_ONLY_COMMANDS.some(
    ([a, b]) => args[0] === a && args[1] === b,
  );
  if (!ok)
    throw new Error(
      `db-parity may not run \`supabase ${args.slice(0, 2).join(' ')}\`.`,
    );
}

function defaultSupabase(args) {
  assertReadOnlyCommand(args);
  return execFileSync('pnpm', ['exec', 'supabase', ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function jsonFrom(output) {
  const start = output.search(/[[{]/);
  if (start === -1)
    throw new FormatError('`supabase db query` printed no JSON.');
  try {
    return JSON.parse(output.slice(start));
  } catch {
    throw new FormatError(
      '`supabase db query` printed JSON that could not be read.',
    );
  }
}

/** The flags that point a read-only command at a source. */
function sourceFlags(source) {
  return source.kind === 'linked'
    ? ['--linked']
    : [
        '--db-url',
        `${source.url}${source.url.includes('?') ? '&' : '?'}sslmode=disable`,
      ];
}

function collect(source, deps) {
  const common = ['--agent', 'no'];
  const query = (sql) => {
    assertReadOnlySql(sql);
    return jsonFrom(
      deps.supabase([
        'db',
        'query',
        ...sourceFlags(source),
        '--output-format',
        'json',
        ...common,
        sql,
      ]),
    );
  };
  return {
    dump: () =>
      deps.supabase([
        'db',
        'dump',
        ...sourceFlags(source),
        '--schema',
        'public,private',
        ...common,
      ]),
    policies: () => query(POLICY_SQL),
    bucket: () => query(BUCKET_SQL)[0] ?? null,
    ledger: () =>
      parseMigrationList(
        deps.supabase([
          'migration',
          'list',
          ...sourceFlags(source),
          '--output-format',
          'json',
          ...common,
        ]),
      ),
  };
}

function fileVersions(deps) {
  return deps
    .readdir(join(root, 'supabase/migrations'))
    .filter((f) => /^\d+_.*\.sql$/.test(f))
    .map((f) => f.split('_')[0])
    .sort();
}

/** The run, with its effects injected so a test can watch exactly what would be sent. */
export async function run(argv, env = process.env, deps = {}) {
  const d = {
    supabase: defaultSupabase,
    readFile: (p) => readFileSync(p, 'utf8'),
    exists: existsSync,
    readdir: readdirSync,
    isolatedStack: isolatedStackStatus,
    out: (line) => console.log(line),
    err: (line) => process.stderr.write(`${line}\n`),
    ...deps,
  };

  for (const flag of REF_FLAGS) {
    if (argv.some((a) => a === flag || a.startsWith(`${flag}=`))) {
      d.err(
        `db-parity: ${flag} is refused. The expected project ref comes only from the Environments table of ${LEDGER}.`,
      );
      return 1;
    }
  }
  const environment = flagValue(argv, 'environment');
  if (!environment) {
    d.err(
      'usage: db-parity.mjs --environment <name> [--expect-pending <v1,v2,...>]',
    );
    return 2;
  }

  try {
    const ledgerPath = env.SYNAPCITY_PARITY_LEDGER ?? join(root, LEDGER);
    const allowlistPath =
      env.SYNAPCITY_PARITY_ALLOWLIST ?? join(root, ALLOWLIST);
    const expectedRef = expectedRefFor(d.readFile(ledgerPath), environment);
    if (!expectedRef) {
      d.err(
        `db-parity: the ledger names no project ref for environment "${environment}".`,
      );
      return 1;
    }
    const allowlist = d.exists(allowlistPath)
      ? parseAllowlist(d.readFile(allowlistPath))
      : new Map();

    // The target. Local: a loopback database. Anything else: the linked project,
    // and only after its ref matches the ledger.
    let target;
    if (environment === 'local') {
      const url =
        env.SYNAPCITY_PARITY_TARGET_DB_URL ?? d.isolatedStack()?.dbUrl;
      if (!url) {
        d.err(
          'db-parity: no local database (start one with `pnpm db:stack start`).',
        );
        return 1;
      }
      assertLocalTarget(url);
      target = { kind: 'db-url', url };
      d.out(`target: environment local, ${redactUrl(url)}`);
    } else {
      const refFile = join(root, 'supabase/.temp/project-ref');
      if (!d.exists(refFile)) {
        d.err(
          'db-parity: no project is linked (supabase/.temp/project-ref is missing).',
        );
        return 1;
      }
      const linked = d.readFile(refFile).trim();
      d.out(`target: environment ${environment}`);
      d.out(`  expected ref (ledger): ${expectedRef}`);
      d.out(`  linked project ref:    ${linked}`);
      if (linked !== expectedRef) {
        d.err(
          "db-parity: the linked project is not the ledger's project for this environment. Nothing was run.",
        );
        return 1;
      }
      target = { kind: 'linked' };
    }

    // The reference: a fresh stack built from this checkout's migrations.
    const fresh = d.isolatedStack();
    if (!fresh) {
      d.err(
        'db-parity: needs a fresh local stack for the reference (`pnpm db:stack start --fresh`).',
      );
      return 1;
    }
    assertLocalTarget(fresh.dbUrl);
    const reference = { kind: 'db-url', url: fresh.dbUrl };

    const remote = collect(target, d);
    const local = collect(reference, d);

    // 1. Ledger.
    const files = fileVersions(d);
    const ledger = classifyLedger(remote.ledger(), files);
    d.out(
      `ledger: ${ledger.both.length} applied, ${ledger.localOnly.length} pending (local-only), ${ledger.remoteOnly.length} drift (remote-only)`,
    );
    for (const v of ledger.localOnly) d.out(`  pending   ${v}`);
    for (const v of ledger.remoteOnly) d.out(`  DRIFT     ${v}`);
    let failed = ledger.remoteOnly.length > 0;
    if (ledger.filesNotReported.length || ledger.reportedNotFiles.length) {
      d.err(
        "db-parity: the CLI's local column does not match the migration files on this commit.",
      );
      failed = true;
    }
    const expectPending = flagValue(argv, 'expect-pending');
    if (expectPending !== undefined) {
      const want = expectPending.split(',').filter(Boolean).sort().join(',');
      if (want !== [...ledger.localOnly].sort().join(',')) {
        d.err(
          `db-parity: the pending set is not exactly the train (wanted ${want || 'none'}).`,
        );
        failed = true;
      }
    }

    // 2 and 3. Schema and storage.
    const differences = [
      ...compareSchemas(local.dump(), remote.dump()),
      ...comparePolicies(local.policies(), remote.policies()),
      ...compareBucket(local.bucket(), remote.bucket()),
    ];
    const { expected, actionable } = classifyDifferences(
      differences,
      allowlist,
    );
    d.out(
      `schema: ${actionable.length} actionable, ${expected.length} expected (allowlisted)`,
    );
    for (const x of expected)
      d.out(`  expected  ${x.kind}: ${x.key} (${x.reason})`);
    for (const x of actionable) d.out(`  ACTION    ${x.kind}: ${x.key}`);
    if (actionable.length) failed = true;

    d.out(
      failed
        ? 'RESULT: differences need action'
        : 'RESULT: no actionable differences',
    );
    return failed ? 1 : 0;
  } catch (error) {
    if (error instanceof TargetRefusedError) {
      d.err(`db-parity: ${error.message}`);
      return 1;
    }
    if (error instanceof FormatError) {
      d.err(
        `db-parity: stopped. ${error.message} Report it instead of guessing at the output.`,
      );
      return 2;
    }
    d.err(
      `db-parity: ${error.stderr ? String(error.stderr).split('\n')[0] : error.message}`,
    );
    return 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exit(await run(process.argv.slice(2)));
}
