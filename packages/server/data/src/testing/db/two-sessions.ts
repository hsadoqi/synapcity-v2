import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
} from 'node:child_process';

import { stackEnv } from './stack-env';

/*
 * Two database sessions with explicit barriers, for tests of rules that span
 * rows (a lock protocol, a race between two writers). Each session is one
 * `psql` process driven through its standard input, so no Postgres client
 * library is needed. A statement that blocks on a lock simply does not resolve
 * until the other session lets go; `waitForLockWait` is the barrier that proves
 * the second session is really waiting, not merely slow.
 */

export type StatementResult = { out: string; err: string };

type Pending = {
  marker: string;
  resolve: (result: StatementResult) => void;
};

export class PsqlSession {
  private out = '';
  private err = '';
  private counter = 0;
  private readonly pending: Pending[] = [];
  /** The backend process id, for `pg_stat_activity`. */
  pid = 0;

  private constructor(private readonly child: ChildProcessWithoutNullStreams) {
    child.stdout.on('data', (chunk: Buffer) => this.feed('out', chunk));
    child.stderr.on('data', (chunk: Buffer) => this.feed('err', chunk));
  }

  static async open(dbUrl: string = stackEnv().dbUrl): Promise<PsqlSession> {
    // ON_ERROR_STOP stays off: a failed statement is a result to assert on.
    const child = spawn(
      'psql',
      ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=0', dbUrl],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const session = new PsqlSession(child);
    const { out } = await session.run('select pg_backend_pid()');
    session.pid = Number.parseInt(out.trim(), 10);
    if (!Number.isInteger(session.pid))
      throw new Error('psql did not report a backend pid.');
    return session;
  }

  private feed(stream: 'out' | 'err', chunk: Buffer) {
    this[stream] += chunk.toString('utf8');
    this.settle();
  }

  /** Resolves each statement, in order, once both its markers have arrived. */
  private settle() {
    for (;;) {
      const next = this.pending[0];
      if (!next) return;
      const outAt = this.out.indexOf(next.marker);
      const errAt = this.err.indexOf(next.marker);
      if (outAt < 0 || errAt < 0) return;
      const result = {
        out: this.out.slice(0, outAt),
        err: this.err.slice(0, errAt),
      };
      this.out = this.out.slice(outAt + next.marker.length).replace(/^\n/, '');
      this.err = this.err.slice(errAt + next.marker.length).replace(/^\n/, '');
      this.pending.shift();
      next.resolve(result);
    }
  }

  /**
   * Sends one statement and resolves with what it printed. A statement that
   * waits on a lock resolves only after the lock is released, so do not
   * `await` it until the other session has been told to proceed.
   */
  run(sql: string): Promise<StatementResult> {
    const marker = `__done_${(this.counter += 1)}_${this.child.pid}__`;
    const statement = sql.trim().endsWith(';') ? sql.trim() : `${sql.trim()};`;
    return new Promise((resolve) => {
      this.pending.push({ marker, resolve });
      this.child.stdin.write(
        `${statement}\n\\echo ${marker}\n\\warn ${marker}\n`,
      );
    });
  }

  async close(): Promise<void> {
    if (this.child.exitCode !== null) return;
    this.child.stdin.end();
    await new Promise<void>((done) => this.child.once('exit', () => done()));
  }
}

/** Opens `count` sessions and closes them all when `use` finishes or throws. */
export async function withSessions<T>(
  count: number,
  use: (sessions: PsqlSession[]) => Promise<T>,
  dbUrl: string = stackEnv().dbUrl,
): Promise<T> {
  const sessions: PsqlSession[] = [];
  try {
    for (let i = 0; i < count; i += 1)
      sessions.push(await PsqlSession.open(dbUrl));
    return await use(sessions);
  } finally {
    // A session left inside a transaction is rolled back by closing it.
    await Promise.all(sessions.map((session) => session.close()));
  }
}

/** The wait the backend `pid` is in right now, from a separate short connection. */
function waitEventOf(pid: number, dbUrl: string = stackEnv().dbUrl): string {
  const result = spawnSync(
    'psql',
    [
      '-X',
      '-q',
      '-A',
      '-t',
      dbUrl,
      '-c',
      `select coalesce(wait_event_type, '') from pg_stat_activity where pid = ${Math.trunc(pid)}`,
    ],
    { encoding: 'utf8' },
  );
  return result.stdout.trim();
}

/**
 * The barrier: resolves once the session's backend is waiting on a lock, and
 * fails after `timeoutMs`. Proves a second writer is blocked by the first.
 */
export async function waitUntilBlocked(
  session: PsqlSession,
  timeoutMs = 10_000,
  dbUrl: string = stackEnv().dbUrl,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (waitEventOf(session.pid, dbUrl) === 'Lock') return;
    await new Promise((done) => setTimeout(done, 50));
  }
  throw new Error(`Backend ${session.pid} never waited on a lock.`);
}
