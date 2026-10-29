// The local-session runner's rules for which server it tests and what it may
// stop (`e2e/support/local-session.ts`). The Playwright suite itself needs the
// local Supabase stack and is not part of `pnpm test`.
import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LockHeldError,
  acquireLock,
  hasListener,
  siteOriginFrom,
  stopServer,
  waitForBuild,
} from '../e2e/support/local-session';
import type { StartedServer } from '../e2e/support/local-session';

const listening: Server[] = [];
const children: ChildProcess[] = [];
const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    listening
      .splice(0)
      .map((server) => new Promise((resolve) => server.close(resolve))),
  );
  for (const child of children.splice(0)) {
    if (child.pid && child.exitCode === null) child.kill('SIGKILL');
  }
  for (const directory of directories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const scratch = () => {
  const directory = mkdtempSync(join(tmpdir(), 'local-session-test-'));
  directories.push(directory);
  return directory;
};

async function listen(server: Server): Promise<number> {
  listening.push(server);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  return (server.address() as { port: number }).port;
}

describe('the origin the stack redirects to', () => {
  it('is the [auth] site_url of the repository config', () => {
    const toml = readFileSync(
      new URL('../../../supabase/config.toml', import.meta.url),
      'utf8',
    );

    expect(siteOriginFrom(toml).origin).toBe('http://127.0.0.1:3000');
  });

  it('reads site_url from [auth] and ignores the same key elsewhere', () => {
    const toml = [
      '[other]',
      'site_url = "http://127.0.0.1:1111"',
      '[auth]',
      'enabled = true',
      'site_url = "http://localhost:4000"',
      '[auth.email]',
      'site_url = "http://127.0.0.1:2222"',
    ].join('\n');

    expect(siteOriginFrom(toml).origin).toBe('http://localhost:4000');
  });

  it.each([
    ['no site_url', '[auth]\nenabled = true\n'],
    ['a hosted address', '[auth]\nsite_url = "http://example.com:3000"\n'],
    ['https', '[auth]\nsite_url = "https://127.0.0.1:3000"\n'],
    ['no port', '[auth]\nsite_url = "http://127.0.0.1"\n'],
  ])('is refused for %s', (_name, toml) => {
    expect(() => siteOriginFrom(toml)).toThrow();
  });
});

describe('the machine-wide lock', () => {
  it('lets one run in and names it to the next', () => {
    const directory = scratch();
    const release = acquireLock('stack', '/checkout/a', directory);

    let refused: unknown;
    try {
      acquireLock('stack', '/checkout/b', directory);
    } catch (error) {
      refused = error;
    }

    expect(refused).toBeInstanceOf(LockHeldError);
    expect((refused as LockHeldError).owner).toMatchObject({
      pid: process.pid,
      checkout: '/checkout/a',
    });
    expect((refused as LockHeldError).message).toContain('/checkout/a');
    release();
  });

  it('is free again once released, and a different stack has its own lock', () => {
    const directory = scratch();
    acquireLock('stack', '/checkout/a', directory)();

    expect(() =>
      acquireLock('stack', '/checkout/b', directory)(),
    ).not.toThrow();

    const held = acquireLock('stack', '/checkout/a', directory);
    expect(() =>
      acquireLock('other', '/checkout/b', directory)(),
    ).not.toThrow();
    held();
  });

  it('is taken over from a run that died without releasing it', async () => {
    const directory = scratch();
    const child = spawn(process.execPath, ['-e', '']);
    await new Promise((resolve) => child.once('exit', resolve));
    const release = acquireLock('stack', '/checkout/a', directory);
    // Rewrite the owner as the dead process, as a killed run would leave it.
    writeFileSync(
      join(lockPath(directory), 'owner.json'),
      JSON.stringify({ pid: child.pid, checkout: '/dead', startedAt: 'then' }),
    );

    expect(() =>
      acquireLock('stack', '/checkout/b', directory)(),
    ).not.toThrow();
    release();
  });

  it('does not let a run release a lock another run took over', () => {
    const directory = scratch();
    const release = acquireLock('stack', '/checkout/a', directory);
    const owner = join(lockPath(directory), 'owner.json');
    writeFileSync(
      owner,
      JSON.stringify({
        pid: process.pid + 1,
        checkout: '/other',
        startedAt: 'now',
      }),
    );

    release();

    expect(readFileSync(owner, 'utf8')).toContain('/other');
  });
});

/** The single lock directory created in `directory`. */
function lockPath(directory: string): string {
  const entries = readdirSync(directory).filter((n) => n.endsWith('.lock'));
  expect(entries).toHaveLength(1);
  return join(directory, entries[0]!);
}

describe('looking for a listener', () => {
  it('finds one that accepts connections and never answers', async () => {
    const silent = createTcpServer((socket) => socket.on('error', () => {}));
    await new Promise<void>((resolve) => silent.listen(0, resolve));
    const { port } = silent.address() as { port: number };

    try {
      expect(await hasListener(port)).toBe(true);
    } finally {
      await new Promise((resolve) => silent.close(resolve));
    }
  });

  it('finds none on a free port', async () => {
    const probe = createTcpServer();
    await new Promise<void>((resolve) => probe.listen(0, resolve));
    const { port } = probe.address() as { port: number };
    await new Promise((resolve) => probe.close(resolve));

    expect(await hasListener(port)).toBe(false);
  });
});

describe('proving the answering server is this build', () => {
  const never = new Promise<string>(() => {});
  const serving = (buildId: string) =>
    createServer((request, response) => {
      response.statusCode =
        request.url === `/_next/static/${buildId}/_buildManifest.js`
          ? 200
          : 404;
      response.end();
    });

  it('accepts a server that serves the build', async () => {
    const port = await listen(serving('abc'));
    const server = { exited: never } as StartedServer;

    await expect(
      waitForBuild({
        server,
        origin: new URL(`http://127.0.0.1:${port}`),
        buildId: 'abc',
        timeoutMs: 2000,
      }),
    ).resolves.toBeUndefined();
  });

  it('refuses a server that answers but runs another build', async () => {
    const port = await listen(serving('another-checkouts-build'));
    const server = { exited: never } as StartedServer;
    const started = Date.now();

    await expect(
      waitForBuild({
        server,
        origin: new URL(`http://127.0.0.1:${port}`),
        buildId: 'abc',
        timeoutMs: 600,
      }),
    ).rejects.toThrow(/did not serve build abc within 600 ms/);
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('fails with the output of an app that exited, without waiting out the deadline', async () => {
    const port = await listen(serving('abc'));
    const server = {
      exited: Promise.resolve('Error: listen EADDRINUSE'),
    } as StartedServer;
    const started = Date.now();

    await expect(
      waitForBuild({
        server,
        origin: new URL(`http://127.0.0.1:${port + 1}`),
        buildId: 'abc',
        timeoutMs: 30_000,
      }),
    ).rejects.toThrow(/exited before answering[\s\S]*EADDRINUSE/);
    expect(Date.now() - started).toBeLessThan(3000);
  });
});

describe('stopping the server', () => {
  const sleeper = () => {
    const child = spawn(
      process.execPath,
      ['-e', 'setInterval(() => {}, 1000)'],
      {
        detached: true,
        stdio: 'ignore',
      },
    );
    children.push(child);
    return child;
  };
  const isAlive = (pid: number) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  };

  it('stops the process it started and no other', async () => {
    const owned = sleeper();
    const unrelated = sleeper();
    const server: StartedServer = {
      child: owned,
      exited: new Promise((resolve) => owned.once('exit', () => resolve(''))),
    };

    await stopServer(server);

    expect(isAlive(owned.pid!)).toBe(false);
    expect(isAlive(unrelated.pid!)).toBe(true);
  });
});
