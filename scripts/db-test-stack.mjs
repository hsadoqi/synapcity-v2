// A disposable local Supabase stack for database tests, one per worktree.
//
// Every worktree shares `project_id = "synapcity"` and the default ports, so two
// `supabase start` runs collide and a test run can see another worktree's rows.
// This script starts a separate stack from a copy of supabase/config.toml with a
// per-worktree project id and a free block of ports. The migrations are
// symlinked, so the stack always applies the checked-out files. Only what the
// database tests need runs (database, API gateway, Auth, REST, Storage, mail).
//
// Nothing here reaches a hosted project: the stack is Docker containers on
// loopback, and the printed connection details are checked with the same guard
// as the other development tools.
//
// Usage:
//   node scripts/db-test-stack.mjs start [--fresh]   start (or reuse) the stack
//   node scripts/db-test-stack.mjs stop              stop it and delete its data
//   node scripts/db-test-stack.mjs status            print its connection details as JSON
//   node scripts/db-test-stack.mjs env [--keys]      print KEY=value lines for a shell
//   node scripts/db-test-stack.mjs dir               print the stack's state directory (it holds the run lock)
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertLocalTarget } from './lib/loopback.mjs';

const root = realpathSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '..'),
);

// Containers the database tests never use. Auth, Storage and the mail catcher
// stay: the two-user tests sign in and the account tests upload avatars.
export const EXCLUDED_SERVICES = [
  'studio',
  'realtime',
  'imgproxy',
  'edge-runtime',
  'logflare',
  'vector',
  'supavisor',
  'postgres-meta',
];

const PORT_OFFSETS = {
  api: 0,
  db: 1,
  shadow: 2,
  studio: 3,
  mail: 4,
  analytics: 5,
  pooler: 6,
  inspector: 7,
};
const PORT_BASE = 55000;
const PORT_BLOCKS = 800;
const BLOCK_SIZE = 10;

/** A short, stable id for this checkout: the same path always gets the same stack. */
export function worktreeId(path) {
  return createHash('sha256').update(path).digest('hex').slice(0, 8);
}

export function stackDirectory(id) {
  return join(tmpdir(), 'synapcity-db-stack', id);
}

export function portsFor(base) {
  return Object.fromEntries(
    Object.entries(PORT_OFFSETS).map(([name, offset]) => [name, base + offset]),
  );
}

/** The preferred port block for an id, then the following ones, wrapping. */
export function* candidateBases(id) {
  const first = parseInt(id, 16) % PORT_BLOCKS;
  for (let i = 0; i < PORT_BLOCKS; i += 1) {
    yield PORT_BASE + ((first + i) % PORT_BLOCKS) * BLOCK_SIZE;
  }
}

function portIsFree(port) {
  return new Promise((done) => {
    const server = createServer();
    server.once('error', () => done(false));
    server.listen(port, '127.0.0.1', () => server.close(() => done(true)));
  });
}

async function blockIsFree(base) {
  const ports = Object.values(portsFor(base));
  const results = await Promise.all(ports.map(portIsFree));
  return results.every(Boolean);
}

/**
 * Rewrites the settings that must differ for a second stack. Everything else
 * in the file (Auth, Storage, API settings) is kept as it is, so the stack
 * behaves like the one `supabase start` would run from this checkout.
 */
export function rewriteConfig(text, { projectId, ports }) {
  const portBySection = {
    api: ports.api,
    db: ports.db,
    'db.pooler': ports.pooler,
    studio: ports.studio,
    local_smtp: ports.mail,
    analytics: ports.analytics,
    edge_runtime: undefined,
  };
  let section = '';
  const lines = text.split('\n').map((line) => {
    const header = /^\[([^\]]+)\]\s*$/.exec(line);
    if (header) {
      section = header[1];
      return line;
    }
    if (/^project_id\s*=/.test(line)) return `project_id = "${projectId}"`;
    if (/^port\s*=/.test(line) && portBySection[section] !== undefined) {
      return `port = ${portBySection[section]}`;
    }
    if (section === 'db' && /^shadow_port\s*=/.test(line)) {
      return `shadow_port = ${ports.shadow}`;
    }
    if (section === 'edge_runtime' && /^inspector_port\s*=/.test(line)) {
      return `inspector_port = ${ports.inspector}`;
    }
    // A disposable database starts empty: the seed file is for `db reset`.
    if (section === 'db.seed' && /^enabled\s*=/.test(line))
      return 'enabled = false';
    return line;
  });
  return lines.join('\n');
}

function supabase(args, options = {}) {
  return execFileSync('pnpm', ['exec', 'supabase', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function readState(id) {
  const file = join(stackDirectory(id), 'state.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function describeStack(workdir) {
  const output = supabase(['status', '-o', 'json', '--workdir', workdir]);
  const status = JSON.parse(output.slice(output.indexOf('{')));
  // The guard runs on what the CLI reports, not on what this script intended.
  assertLocalTarget(status.DB_URL);
  for (const key of ['API_URL']) {
    assertLocalTarget(`postgresql://u@${new URL(status[key]).host}/x`);
  }
  return {
    apiUrl: status.API_URL,
    dbUrl: status.DB_URL,
    mailUrl: status.MAILPIT_URL ?? status.INBUCKET_URL ?? null,
    anonKey: status.ANON_KEY ?? status.PUBLISHABLE_KEY,
    publishableKey: status.PUBLISHABLE_KEY ?? status.ANON_KEY,
    serviceKey: status.SERVICE_ROLE_KEY ?? status.SECRET_KEY,
  };
}

function isRunning(workdir) {
  try {
    describeStack(workdir);
    return true;
  } catch {
    return false;
  }
}

export async function start({ fresh = false } = {}) {
  const id = worktreeId(root);
  const dir = stackDirectory(id);
  const workdir = join(dir, 'work');
  const projectId = `synapcity-t${id}`;
  const previous = readState(id);

  if (previous && isRunning(workdir)) {
    if (!fresh) return { ...previous, ...describeStack(workdir), reused: true };
    stop();
  }

  let base;
  for (const candidate of candidateBases(id)) {
    if (await blockIsFree(candidate)) {
      base = candidate;
      break;
    }
  }
  if (base === undefined)
    throw new Error('No free block of ports for the test stack.');
  const ports = portsFor(base);

  rmSync(workdir, { recursive: true, force: true });
  mkdirSync(join(workdir, 'supabase'), { recursive: true });
  const config = readFileSync(join(root, 'supabase/config.toml'), 'utf8');
  writeFileSync(
    join(workdir, 'supabase/config.toml'),
    rewriteConfig(config, { projectId, ports }),
  );
  symlinkSync(
    join(root, 'supabase/migrations'),
    join(workdir, 'supabase/migrations'),
  );
  // An empty seed keeps the CLI from looking for a file that is not copied.
  writeFileSync(join(workdir, 'supabase/seed.sql'), '');

  // stdout is dropped: `start` prints the stack's keys as JSON when an agent
  // runs it, and `status` below reads them again where they are needed.
  supabase(['start', '--workdir', workdir, '-x', EXCLUDED_SERVICES.join(',')], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const details = describeStack(workdir);
  const state = { id, projectId, workdir, ports, ...details };
  writeFileSync(join(dir, 'state.json'), JSON.stringify(state, null, 2), {
    mode: 0o600,
  });
  return { ...state, reused: false };
}

export function stop() {
  const id = worktreeId(root);
  const dir = stackDirectory(id);
  const workdir = join(dir, 'work');
  if (existsSync(join(workdir, 'supabase/config.toml'))) {
    // `--no-backup` deletes this stack's volumes, and only this stack's: the
    // project id in the copied config differs from every other worktree's.
    supabase(['stop', '--no-backup', '--workdir', workdir], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
  }
  rmSync(dir, { recursive: true, force: true });
}

/** The isolated stack's connection details when it is running, else null. */
export function status() {
  const id = worktreeId(root);
  const state = readState(id);
  if (!state || !isRunning(state.workdir)) return null;
  return { ...state, ...describeStack(state.workdir) };
}

async function main() {
  const [command, ...flags] = process.argv.slice(2);
  if (command === 'start') {
    const result = await start({ fresh: flags.includes('--fresh') });
    console.log(
      `db-test-stack: ${result.reused ? 'reusing' : 'started'} ${result.projectId} on ports ${result.ports.api}-${result.ports.inspector}`,
    );
  } else if (command === 'stop') {
    stop();
    console.log('db-test-stack: stopped');
  } else if (command === 'status' || command === 'env') {
    const state = status();
    if (!state) {
      process.stderr.write('db-test-stack: not running\n');
      process.exit(1);
    }
    if (command === 'status') {
      // Keys are local development keys, but still never printed by `status`.
      const { anonKey, publishableKey, serviceKey, ...safe } = state;
      void anonKey;
      void publishableKey;
      void serviceKey;
      console.log(JSON.stringify(safe, null, 2));
    } else {
      console.log(`SUPABASE_DB_URL=${state.dbUrl}`);
      console.log(`E2E_API_URL=${state.apiUrl}`);
      console.log(`DB_TEST_API_URL=${state.apiUrl}`);
      console.log(`E2E_MAIL_URL=${state.mailUrl ?? ''}`);
      // Local development keys of this disposable stack, for the two-user
      // harness. Only on request: nothing prints them by default.
      if (flags.includes('--keys')) {
        console.log(`DB_TEST_PUBLISHABLE_KEY=${state.publishableKey}`);
        console.log(`DB_TEST_SERVICE_KEY=${state.serviceKey}`);
      }
    }
  } else if (command === 'workdir') {
    // The directory that holds this stack's copy of supabase/, for tools that
    // take a `--workdir` (the signed-in browser run: E2E_STACK_WORKDIR).
    const state = status();
    if (!state) {
      process.stderr.write('db-test-stack: not running\n');
      process.exit(1);
    }
    console.log(state.workdir);
  } else if (command === 'dir') {
    console.log(stackDirectory(worktreeId(root)));
  } else {
    process.stderr.write(
      'usage: db-test-stack.mjs start [--fresh] | stop | status | env | workdir | dir\n',
    );
    process.exit(2);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    process.stderr.write(`db-test-stack: ${error.stderr ?? error.message}\n`);
    process.exit(1);
  });
}
