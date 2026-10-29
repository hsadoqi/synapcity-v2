/*
 * The pieces of `pnpm test:e2e:local-session` that decide which server the
 * signed-in checks exercise, and what else the run is allowed to touch. The
 * runner (`e2e/run-local-session.mjs`) composes them: it takes a machine-wide
 * lock, builds the app from this checkout against the local Supabase stack,
 * starts it itself, proves the answering server is that build, runs
 * Playwright, and stops only what it started.
 *
 * One run at a time per machine is a rule, not an accident of the code. The
 * local stack mails sign-in links to its configured `site_url`
 * (`supabase/config.toml`) and refuses any other redirect that is not on its
 * allow-list, so the callback checks only work when the app is served on that
 * exact origin. Two runs would need the same port.
 */
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { connect } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost'];

/** The origin the local stack redirects signed-in links to, from `supabase/config.toml`. */
export function siteOriginFrom(configToml: string): URL {
  const auth = /^\[auth\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(configToml);
  const value = auth && /^site_url\s*=\s*"([^"]+)"/m.exec(auth[1] ?? '')?.[1];
  if (!value) throw new Error('supabase/config.toml has no [auth] site_url.');
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !LOOPBACK_HOSTS.includes(url.hostname) ||
    !url.port
  ) {
    throw new Error(
      `site_url must be http://127.0.0.1:<port> or http://localhost:<port>, got ${value}.`,
    );
  }
  return url;
}

type LockOwner = { pid: number; checkout: string; startedAt: string };

export class LockHeldError extends Error {
  readonly owner: LockOwner | null;

  constructor(owner: LockOwner | null) {
    super(
      owner
        ? `Another local-session run is in progress (pid ${owner.pid}, started ${owner.startedAt}, checkout ${owner.checkout}). ` +
            'The local stack sends sign-in links only to its site_url, so one run can use it at a time on this machine. ' +
            'Wait for that run to finish, or stop it.'
        : 'Another local-session run is starting. Try again in a moment.',
    );
    this.owner = owner;
  }
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but belongs to someone else.
    return (error as NodeJS.ErrnoException).code === 'EPERM';
  }
};

/*
 * A directory is the lock because creating one either succeeds or fails, with
 * no gap between checking and taking it. It names the owner so the next run
 * can tell a live holder from the leftover of a run that was killed.
 */
export function acquireLock(
  key: string,
  checkout: string,
  directory = tmpdir(),
): () => void {
  const path = join(
    directory,
    `synapcity-local-session-${createHash('sha256').update(key).digest('hex').slice(0, 12)}.lock`,
  );
  const ownerFile = join(path, 'owner.json');
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      mkdirSync(path);
      const owner: LockOwner = {
        pid: process.pid,
        checkout,
        startedAt: new Date().toISOString(),
      };
      writeFileSync(ownerFile, JSON.stringify(owner));
      return () => {
        try {
          const held = JSON.parse(readFileSync(ownerFile, 'utf8')) as LockOwner;
          if (held.pid === process.pid) rmSync(path, { recursive: true });
        } catch {
          // Already gone.
        }
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    }
    let owner: LockOwner | null = null;
    try {
      owner = JSON.parse(readFileSync(ownerFile, 'utf8')) as LockOwner;
    } catch {
      // The owner is between creating the directory and naming itself, or died there.
      if (Date.now() - statSync(path).mtimeMs < 10_000) {
        throw new LockHeldError(null);
      }
    }
    if (owner && alive(owner.pid)) throw new LockHeldError(owner);
    rmSync(path, { recursive: true, force: true });
  }
  throw new LockHeldError(null);
}

/*
 * Whether something accepts a TCP connection on the port on either loopback
 * address. Kept apart from the one in `@synapcity/dev-playwright-config`,
 * which is a TypeScript workspace package that plain Node cannot load.
 */
export function hasListener(port: number): Promise<boolean> {
  const tryHost = (host: string) =>
    new Promise<boolean>((resolve) => {
      const socket = connect({ port, host });
      socket.setTimeout(1000, () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });
    });
  return Promise.all([tryHost('127.0.0.1'), tryHost('::1')]).then((answers) =>
    answers.some(Boolean),
  );
}

export type StartedServer = {
  child: ChildProcess;
  /** Resolves with the output tail once the server has exited. */
  exited: Promise<string>;
};

/**
 * Starts `next start` for the build in `distDir`, bound to the stack's
 * origin, in its own process group so that stopping it cannot reach any other
 * process.
 */
export function startServer(options: {
  cwd: string;
  origin: URL;
  distDir: string;
  env: NodeJS.ProcessEnv;
}): StartedServer {
  const child = spawn(
    'pnpm',
    [
      'exec',
      'next',
      'start',
      '--hostname',
      options.origin.hostname,
      '--port',
      options.origin.port,
    ],
    {
      cwd: options.cwd,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...options.env,
        NEXT_DIST_DIR: options.distDir,
        SITE_URL: options.origin.origin,
      },
    },
  );
  let tail = '';
  const keep = (data: Buffer) => {
    tail = (tail + data.toString()).slice(-4000);
  };
  child.stdout?.on('data', keep);
  child.stderr?.on('data', keep);
  const exited = new Promise<string>((resolve) => {
    child.once('exit', () => resolve(tail));
  });
  return { child, exited };
}

/** Stops the server's whole process group, forcefully after a grace period. */
export async function stopServer(server: StartedServer): Promise<void> {
  const { child } = server;
  if (child.pid === undefined || child.exitCode !== null) return;
  const signalGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-child.pid!, signal);
    } catch {
      // The group is already gone.
    }
  };
  signalGroup('SIGTERM');
  const timer = setTimeout(() => signalGroup('SIGKILL'), 10_000);
  await server.exited;
  clearTimeout(timer);
}

/*
 * Waits for the started server to answer and proves the answer is this build:
 * a build id is random per `next build`, and only a server running that build
 * serves its static manifest. Another process on the address, or an older
 * build in another checkout, cannot pass. Gives up when the server exits or
 * the deadline passes, whichever is first.
 */
export async function waitForBuild(options: {
  server: StartedServer;
  origin: URL;
  buildId: string;
  timeoutMs: number;
}): Promise<void> {
  const { server, origin, buildId, timeoutMs } = options;
  const manifest = new URL(
    `/_next/static/${buildId}/_buildManifest.js`,
    origin,
  );
  const deadline = Date.now() + timeoutMs;
  let settled = false;
  const exited = server.exited.then((output) => {
    throw new Error(
      `The app exited before answering on ${origin.origin}.\n${output.trim()}`,
    );
  });
  const answered = (async () => {
    while (!settled && Date.now() < deadline) {
      try {
        const response = await fetch(manifest, {
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) return;
      } catch {
        // Not up yet.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!settled) {
      throw new Error(
        `${origin.origin} did not serve build ${buildId} within ${timeoutMs} ms.`,
      );
    }
  })();
  try {
    await Promise.race([answered, exited]);
  } finally {
    settled = true;
  }
}
