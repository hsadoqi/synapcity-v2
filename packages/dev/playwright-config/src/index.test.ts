import { createServer } from 'node:net';
import type { Server } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { assertNoListener, createPlaywrightConfig } from './index';

const open: Server[] = [];

/** A listener that accepts connections and never answers, like a stuck process. */
async function silentListener(): Promise<number> {
  const server = createServer((socket) => {
    socket.on('error', () => {});
  });
  open.push(server);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return address.port;
}

const touched = ['E2E_PORTS_RESOLVED', 'E2E_WEB_PORT', 'E2E_WEB_URL'] as const;
const saved = Object.fromEntries(touched.map((key) => [key, process.env[key]]));

afterEach(async () => {
  await Promise.all(
    open
      .splice(0)
      .map((server) => new Promise((resolve) => server.close(resolve))),
  );
  for (const key of touched) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('a listener that accepts connections and never answers', () => {
  it('is reported within a bound, naming the address and the variable to unset', async () => {
    const port = await silentListener();
    const started = Date.now();

    await expect(assertNoListener('web', port)).rejects.toThrow(
      new RegExp(
        `http://localhost:${port} already has a listener.*E2E_WEB_PORT`,
      ),
    );
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it('stops createPlaywrightConfig on a pinned port, before any server starts', async () => {
    const port = await silentListener();
    delete process.env.E2E_PORTS_RESOLVED;
    process.env.E2E_WEB_PORT = String(port);
    const started = Date.now();

    await expect(
      createPlaywrightConfig({
        app: { name: 'web', command: () => 'exit 1' },
      }),
    ).rejects.toThrow(`http://localhost:${port} already has a listener`);
    expect(Date.now() - started).toBeLessThan(3000);
    // The failed resolution must not be remembered as a good one.
    expect(process.env.E2E_PORTS_RESOLVED).toBeUndefined();
  });
});

describe('a normal start', () => {
  it('passes a free port and publishes the origin the run will serve', async () => {
    delete process.env.E2E_PORTS_RESOLVED;
    delete process.env.E2E_WEB_PORT;

    const config = await createPlaywrightConfig({
      app: { name: 'web', command: (port) => `serve ${port}` },
    });

    const port = Number(process.env.E2E_WEB_PORT);
    expect(port).toBeGreaterThan(0);
    expect(process.env.E2E_WEB_URL).toBe(`http://localhost:${port}`);
    expect(config.webServer).toMatchObject([
      {
        url: `http://localhost:${port}`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
    ]);
    await expect(assertNoListener('web', port)).resolves.toBeUndefined();
  });

  it('lets a server set its own startup timeout', async () => {
    delete process.env.E2E_PORTS_RESOLVED;
    delete process.env.E2E_WEB_PORT;

    const config = await createPlaywrightConfig({
      app: { name: 'web', command: () => 'serve', startupTimeout: 5000 },
    });

    expect(config.webServer).toMatchObject([{ timeout: 5000 }]);
  });
});
