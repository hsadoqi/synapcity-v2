// The pure parts of `scripts/db-parity.mjs`: reading the deployment ledger,
// reading the Supabase CLI's output, normalizing and comparing schema dumps.
// Nothing here runs a command or opens a connection, so every rule is tested
// with fixtures.
//
// What is never normalized away: grants, row-level-security policies, function
// bodies, SECURITY DEFINER, and search_path settings. Those are the security
// surface, so a difference in any of them is always reported.

export class FormatError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FormatError';
  }
}

// ---------------------------------------------------------------------------
// The deployment ledger: the only source of an expected project ref.

/** Markdown table rows under a heading, as arrays of trimmed cells. */
function tableUnder(markdown, heading) {
  const lines = markdown.split('\n');
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading}`.toLowerCase(),
  );
  if (start === -1) return null;
  const rows = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith('## ')) break;
    if (!line.startsWith('|')) continue;
    const cells = line
      .slice(1, line.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // the separator row
    rows.push(cells);
  }
  return rows;
}

/** `[{ environment, ref }]` from the ledger's "Environments" table. */
export function parseLedgerEnvironments(markdown) {
  const rows = tableUnder(markdown, 'Environments');
  if (!rows)
    throw new FormatError('The ledger has no "## Environments" table.');
  const [header, ...body] = rows;
  const env = header?.findIndex((c) => c.toLowerCase() === 'environment');
  const ref = header?.findIndex((c) => c.toLowerCase() === 'project ref');
  if (env === -1 || ref === -1 || env === undefined) {
    throw new FormatError(
      'The Environments table needs "Environment" and "Project ref" columns.',
    );
  }
  return body
    .map((cells) => ({
      environment: (cells[env] ?? '').replace(/`/g, ''),
      ref: (cells[ref] ?? '').replace(/`/g, ''),
    }))
    .filter((row) => row.environment !== '');
}

/** The expected ref for an environment, or null when the ledger does not name one. */
export function expectedRefFor(markdown, environment) {
  const row = parseLedgerEnvironments(markdown).find(
    (r) => r.environment === environment,
  );
  if (!row || row.ref === '' || /^(—|-|none|tbd|n\/a)$/i.test(row.ref))
    return null;
  return row.ref;
}

// ---------------------------------------------------------------------------
// The migration ledger, from `supabase migration list --output-format json`.

/**
 * `[{ local, remote }]` from the CLI's JSON output, which the CLI preceded with
 * a "Connecting…" line when it checked 2.122.0. Anything else is a format the
 * parser was not written for, and stops the run rather than guessing.
 */
export function parseMigrationList(output) {
  const start = output.indexOf('{');
  if (start === -1)
    throw new FormatError('`supabase migration list` printed no JSON object.');
  let parsed;
  try {
    parsed = JSON.parse(output.slice(start));
  } catch {
    throw new FormatError(
      '`supabase migration list` printed JSON that could not be read.',
    );
  }
  if (!Array.isArray(parsed.migrations)) {
    throw new FormatError(
      '`supabase migration list` JSON has no "migrations" array.',
    );
  }
  return parsed.migrations.map((m) => {
    if (typeof m.local !== 'string' || typeof m.remote !== 'string') {
      throw new FormatError(
        'A migration entry lacks "local" or "remote" (the CLI format changed).',
      );
    }
    return { local: m.local, remote: m.remote };
  });
}

/** Versions in both, only in the files (pending deploy), only on the target (drift). */
export function classifyLedger(entries, fileVersions) {
  const both = [];
  const localOnly = [];
  const remoteOnly = [];
  for (const { local, remote } of entries) {
    if (local && remote) both.push(local);
    else if (local) localOnly.push(local);
    else if (remote) remoteOnly.push(remote);
  }
  // The CLI's "local" column must be the files on this commit.
  const reported = new Set(entries.map((e) => e.local).filter(Boolean));
  const filesNotReported = fileVersions.filter((v) => !reported.has(v));
  const reportedNotFiles = [...reported].filter(
    (v) => !fileVersions.includes(v),
  );
  return { both, localOnly, remoteOnly, filesNotReported, reportedNotFiles };
}

// ---------------------------------------------------------------------------
// Schema dumps.

const DOLLAR_TAG = /\$[A-Za-z0-9_]*\$/g;

/**
 * Splits a pg_dump script into statements. A statement ends at a line that
 * ends with `;` outside a dollar-quoted body, so the semicolons inside a
 * function body do not split it. Comment lines outside bodies are dropped.
 */
export function splitStatements(script) {
  const statements = [];
  let current = [];
  let openTag = null;
  for (const raw of script.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw;
    if (openTag === null && current.length === 0) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('--')) continue;
    }
    current.push(line);
    for (const tag of line.match(DOLLAR_TAG) ?? []) {
      if (openTag === null) openTag = tag;
      else if (tag === openTag) openTag = null;
    }
    if (openTag === null && line.trimEnd().endsWith(';')) {
      statements.push(current.join('\n'));
      current = [];
    }
  }
  if (current.join('').trim() !== '') statements.push(current.join('\n'));
  return statements;
}

/** Collapses whitespace outside dollar-quoted bodies; bodies are kept byte for byte. */
function squeezeOutsideBodies(statement) {
  let out = '';
  let rest = statement;
  for (;;) {
    const open = rest.search(DOLLAR_TAG);
    if (open === -1) return out + rest.replace(/\s+/g, ' ').trim();
    const tag = rest.slice(open).match(DOLLAR_TAG)[0];
    const close = rest.indexOf(tag, open + tag.length);
    if (close === -1) return out + rest.replace(/\s+/g, ' ').trim();
    out +=
      rest.slice(0, open).replace(/\s+/g, ' ') +
      rest.slice(open, close + tag.length);
    rest = rest.slice(close + tag.length);
  }
}

const NOISE = [/^SET\b/i, /^RESET\b/i, /^SELECT pg_catalog\.set_config\b/i];
// Ownership differs by who ran the migration; it is not part of the schema's behaviour.
const OWNER_TO = /^ALTER\b[^;]*\bOWNER TO\b/i;

/** Statements with header noise and ownership removed; extension versions stripped. */
export function normalizeStatements(script) {
  const out = [];
  for (const statement of splitStatements(script)) {
    const squeezed = squeezeOutsideBodies(statement);
    if (NOISE.some((re) => re.test(squeezed))) continue;
    if (OWNER_TO.test(squeezed)) continue;
    out.push(
      squeezed
        .replace(/^(CREATE EXTENSION\b[^;]*?)\s+VERSION\s+"[^"]*"/i, '$1')
        .replace(/^(CREATE EXTENSION\b[^;]*?)\s+VERSION\s+'[^']*'/i, '$1'),
    );
  }
  return out;
}

/** What kind of object a statement is about, and a name that identifies it. */
export function statementKey(statement) {
  const s = statement;
  let m;
  if ((m = /^CREATE (?:OR REPLACE )?FUNCTION (.+?)(?= RETURNS\b)/i.exec(s)))
    return { type: 'function', key: `function ${m[1]}` };
  if (
    (m =
      /^CREATE (?:OR REPLACE )?(?:CONSTRAINT )?TRIGGER (\S+) .*? ON (\S+)/i.exec(
        s,
      ))
  )
    return { type: 'trigger', key: `trigger ${m[1]} on ${m[2]}` };
  if ((m = /^CREATE POLICY (\S+) ON (\S+)/i.exec(s)))
    return { type: 'policy', key: `policy ${m[1]} on ${m[2]}` };
  if ((m = /^CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\S+) ON/i.exec(s)))
    return { type: 'index', key: `index ${m[1]}` };
  if ((m = /^CREATE TABLE (?:IF NOT EXISTS )?(\S+)/i.exec(s)))
    return { type: 'table', key: `table ${m[1]}` };
  if ((m = /^ALTER TABLE (?:ONLY )?(\S+) ADD CONSTRAINT (\S+)/i.exec(s)))
    return { type: 'constraint', key: `constraint ${m[2]} on ${m[1]}` };
  if (
    (m =
      /^ALTER TABLE (?:ONLY )?(\S+) (ENABLE|DISABLE|FORCE|NO FORCE) ROW LEVEL SECURITY/i.exec(
        s,
      ))
  )
    return { type: 'rls', key: `rls ${m[2].toLowerCase()} on ${m[1]}` };
  if (/^(GRANT|REVOKE)\b/i.test(s)) return { type: 'grant', key: s };
  if (/^ALTER DEFAULT PRIVILEGES\b/i.test(s)) return { type: 'grant', key: s };
  if (
    (m =
      /^CREATE (?:OR REPLACE )?(VIEW|MATERIALIZED VIEW|TYPE|SEQUENCE|SCHEMA|EXTENSION|DOMAIN)\b (?:IF NOT EXISTS )?(\S+)/i.exec(
        s,
      ))
  )
    return { type: m[1].toLowerCase(), key: `${m[1].toLowerCase()} ${m[2]}` };
  if ((m = /^COMMENT ON (\S+(?: \S+)?) (\S+)/i.exec(s)))
    return { type: 'comment', key: `comment ${m[1]} ${m[2]}` };
  return { type: 'other', key: s.slice(0, 120) };
}

/** Map of key → statement for a dump; a repeated key gets a counter so none is lost. */
function indexSchema(script) {
  const map = new Map();
  for (const statement of normalizeStatements(script)) {
    const { type, key } = statementKey(statement);
    let unique = key;
    for (let n = 2; map.has(unique); n += 1) unique = `${key} #${n}`;
    map.set(unique, { type, statement });
  }
  return map;
}

/**
 * Differences between a reference schema (what the migrations produce on a fresh
 * stack) and a target's. `reference-only`: the target lacks it. `target-only`:
 * the target has something the migrations do not. `changed`: same object,
 * different definition. Grants, policies, function bodies and the rest of the
 * security surface are compared exactly.
 */
export function compareSchemas(referenceScript, targetScript) {
  const reference = indexSchema(referenceScript);
  const target = indexSchema(targetScript);
  const differences = [];
  for (const [key, ref] of reference) {
    const other = target.get(key);
    if (!other)
      differences.push({ key, type: ref.type, kind: 'reference-only' });
    else if (other.statement !== ref.statement) {
      differences.push({
        key,
        type: ref.type,
        kind: 'changed',
        reference: ref.statement,
        target: other.statement,
      });
    }
  }
  for (const [key, other] of target) {
    if (!reference.has(key))
      differences.push({ key, type: other.type, kind: 'target-only' });
  }
  return differences;
}

// ---------------------------------------------------------------------------
// Storage: the policies on storage.objects and the avatars bucket row.

const squeeze = (text) =>
  typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : text;

/** Differences between two lists of `pg_policies` rows (as the catalog query returns them). */
export function comparePolicies(reference, target) {
  const byName = (rows) => new Map(rows.map((r) => [r.policyname, r]));
  const a = byName(reference);
  const b = byName(target);
  const differences = [];
  const normal = (r) =>
    JSON.stringify({
      ...r,
      qual: squeeze(r.qual),
      with_check: squeeze(r.with_check),
      roles: [...(r.roles ?? [])].sort(),
    });
  for (const [name, row] of a) {
    if (!b.has(name))
      differences.push({
        key: `storage policy ${name}`,
        type: 'policy',
        kind: 'reference-only',
      });
    else if (normal(row) !== normal(b.get(name))) {
      differences.push({
        key: `storage policy ${name}`,
        type: 'policy',
        kind: 'changed',
        reference: normal(row),
        target: normal(b.get(name)),
      });
    }
  }
  for (const name of b.keys()) {
    if (!a.has(name))
      differences.push({
        key: `storage policy ${name}`,
        type: 'policy',
        kind: 'target-only',
      });
  }
  return differences;
}

const BUCKET_FIELDS = [
  'id',
  'name',
  'public',
  'file_size_limit',
  'allowed_mime_types',
];

/** Field-by-field comparison of the `avatars` bucket row. Only these fields; no content is read. */
export function compareBucket(reference, target) {
  if (!reference && !target) return [];
  if (!reference)
    return [
      { key: 'storage bucket avatars', type: 'bucket', kind: 'target-only' },
    ];
  if (!target)
    return [
      { key: 'storage bucket avatars', type: 'bucket', kind: 'reference-only' },
    ];
  const differences = [];
  for (const field of BUCKET_FIELDS) {
    const norm = (v) =>
      Array.isArray(v)
        ? JSON.stringify([...v].sort())
        : JSON.stringify(v ?? null);
    if (norm(reference[field]) !== norm(target[field])) {
      differences.push({
        key: `storage bucket avatars.${field}`,
        type: 'bucket',
        kind: 'changed',
        reference: norm(reference[field]),
        target: norm(target[field]),
      });
    }
  }
  return differences;
}

// ---------------------------------------------------------------------------
// The allowlist: owner-reviewed expected differences, each with a reason.

/** `Map<key, reason>` from the allowlist file's table; a row without a reason is refused. */
export function parseAllowlist(markdown) {
  const rows = tableUnder(markdown, 'Allowed differences');
  if (!rows)
    throw new FormatError(
      'The allowlist has no "## Allowed differences" table.',
    );
  const [header, ...body] = rows;
  const key = header?.findIndex((c) => c.toLowerCase() === 'difference');
  const reason = header?.findIndex((c) => c.toLowerCase() === 'reason');
  if (key === -1 || reason === -1 || key === undefined) {
    throw new FormatError(
      'The allowlist table needs "Difference" and "Reason" columns.',
    );
  }
  const map = new Map();
  for (const cells of body) {
    const k = (cells[key] ?? '').replace(/^`|`$/g, '');
    const why = cells[reason] ?? '';
    if (k === '' || /^(—|-|none)$/i.test(k)) continue;
    if (why === '' || /^(—|-|tbd)$/i.test(why)) {
      throw new FormatError(
        `Allowlist entry "${k}" has no reason; every expected difference needs one.`,
      );
    }
    map.set(k, why);
  }
  return map;
}

/** Splits differences into those the allowlist expects and those that need action. */
export function classifyDifferences(differences, allowlist) {
  const expected = [];
  const actionable = [];
  for (const d of differences) {
    if (allowlist.has(d.key))
      expected.push({ ...d, reason: allowlist.get(d.key) });
    else actionable.push(d);
  }
  return { expected, actionable };
}
