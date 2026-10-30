// The local-target guard shared by the development tools that open a database
// connection (`db:types`, `db:test`, the test stack and parity scripts). The
// guard is code, not a comment: a script calls `assertLocalTarget` before it
// spawns anything that could connect. It is not a Preview-isolation measure; it
// protects development tooling only.
//
// A target is local when its host is `127.0.0.1` or `localhost`. The URL is
// parsed rather than pattern-matched, so `postgresql://127.0.0.1@db.x.co/` (a
// host disguised as a user name) is read as the host it is. libpq also lets a
// query parameter replace the host, so those parameters are refused.

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const HOST_OVERRIDING_PARAMS = ['host', 'hostaddr', 'service'];
const PROJECT_REF = /^[a-z0-9]{20}$/;

export class TargetRefusedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TargetRefusedError';
  }
}

/** The pieces of a Postgres URL that decide whether it is local; never the password. */
function describeTarget(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    // A connection string that is not a URL (key=value pairs, several hosts)
    // cannot be checked, so it is refused rather than guessed at.
    throw new TargetRefusedError(
      'The database target is not a single postgresql:// URL.',
    );
  }
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new TargetRefusedError(
      'The database target is not a postgresql:// URL.',
    );
  }
  for (const param of HOST_OVERRIDING_PARAMS) {
    if (url.searchParams.has(param)) {
      throw new TargetRefusedError(
        `The database target sets "${param}" in its query, which can replace the host.`,
      );
    }
  }
  return {
    host: url.hostname,
    port: url.port,
    user: decodeURIComponent(url.username),
    isLocal: LOCAL_HOSTS.has(url.hostname),
  };
}

/**
 * The hosted project ref a URL names: `db.<ref>.supabase.co`, or the
 * `postgres.<ref>` user of a pooler URL. Null when it names none.
 */
export function projectRefOf(rawUrl) {
  const { host, user } = describeTarget(rawUrl);
  const direct = /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(host);
  if (direct) return direct[1];
  const pooled = /^postgres\.([a-z0-9]{20})$/.exec(user);
  if (pooled && host.endsWith('.pooler.supabase.com')) return pooled[1];
  return null;
}

/**
 * Throws `TargetRefusedError` unless the target is loopback, or the caller
 * passed `allowRemoteTarget` equal to the project ref the URL names. Returns
 * `{ remote: boolean, ref: string | null }`.
 */
export function assertLocalTarget(rawUrl, { allowRemoteTarget } = {}) {
  const target = describeTarget(rawUrl);
  if (target.isLocal) return { remote: false, ref: null };
  if (allowRemoteTarget === undefined) {
    throw new TargetRefusedError(
      `Refusing a non-loopback database target (${target.host}). ` +
        'These tools only run against 127.0.0.1 or localhost.',
    );
  }
  if (!PROJECT_REF.test(allowRemoteTarget)) {
    throw new TargetRefusedError(
      '--allow-remote-target needs a project ref (20 lowercase letters or digits).',
    );
  }
  const ref = projectRefOf(rawUrl);
  if (ref === null || ref !== allowRemoteTarget) {
    throw new TargetRefusedError(
      `--allow-remote-target ${allowRemoteTarget} does not match the project ref ` +
        `in the target (${ref ?? 'none found'}).`,
    );
  }
  return { remote: true, ref };
}

/** A URL safe to print: credentials removed. */
export function redactUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`;
  } catch {
    return '<unparseable database target>';
  }
}

/** Reads `--name value` and `--name=value` from argv. */
export function flagValue(argv, name) {
  const prefix = `--${name}=`;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === `--${name}`) return argv[i + 1];
    if (argv[i].startsWith(prefix)) return argv[i].slice(prefix.length);
  }
  return undefined;
}
