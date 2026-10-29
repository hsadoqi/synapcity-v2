import { createServer } from 'node:net';
import type { AddressInfo, Server as NetServer } from 'node:net';
import { defineConfig, devices } from '@playwright/test';
import type { PlaywrightTestConfig } from '@playwright/test';

type E2EServer = {
  /**
   * Short lowercase name, such as `web`. It names the server in logs and in
   * the environment variables this config reads and sets:
   * `E2E_<NAME>_PORT` pins the port, `E2E_<NAME>_URL` is the origin the run
   * serves it on.
   */
  name: string;
  /** Command that starts the server on the given port. */
  command: (port: number) => string;
  /**
   * Environment for the command, given a lookup of any server's origin in
   * this run by name. Added to the inherited environment.
   */
  env?: (origin: (name: string) => string) => Record<string, string>;
};

type CreatePlaywrightConfigInput = {
  /** The app under test. Its origin is the tests' `baseURL`. */
  app: E2EServer;
  /** Directory holding the `*.e2e.ts` files. Defaults to `e2e`. */
  testDir?: string;
  /**
   * Other apps the tests need running, for a flow that crosses apps. Started
   * and owned exactly like the main one.
   */
  extraServers?: E2EServer[];
};

const portVariable = (name: string) => `E2E_${name.toUpperCase()}_PORT`;
const urlVariable = (name: string) => `E2E_${name.toUpperCase()}_URL`;

// Marks that this process tree already chose its ports, so the config reloaded
// by each Playwright worker neither chooses again nor repeats the log line.
const RESOLVED = 'E2E_PORTS_RESOLVED';

/*
 * Asks the operating system for free ports, all held open together so no two
 * servers get the same one. The listener binds the way a Node HTTP server
 * does by default (dual-stack, every interface), so a port free here is free
 * for the app as well. Another process can still take a port between this
 * check and the app binding it; that run fails with an error and never
 * silently tests the other process (`reuseExistingServer` is off).
 */
async function freePorts(count: number): Promise<number[]> {
  const held: NetServer[] = [];
  try {
    for (let i = 0; i < count; i += 1) {
      const server = createServer();
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, resolve);
      });
      held.push(server);
    }
    return held.map((server) => (server.address() as AddressInfo).port);
  } finally {
    await Promise.all(
      held.map(
        (server) =>
          new Promise<void>((resolve) => server.close(() => resolve())),
      ),
    );
  }
}

function pinnedPort(name: string): number | undefined {
  const variable = portVariable(name);
  const raw = process.env[variable];
  if (raw === undefined || raw === '') return undefined;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `${variable} must be a port from 1 to 65535, got "${raw}".`,
    );
  }
  return port;
}

/*
 * End-to-end config for one app, safe to run in several checkouts at once.
 *
 * - Every run picks its own free port for each server (or takes one pinned
 *   through `E2E_<NAME>_PORT`), so concurrent runs never share an address.
 * - Playwright always starts the servers itself and refuses to run when
 *   something already listens on the chosen address, locally and in CI. A run
 *   therefore only ever tests the server it started, from this checkout (the
 *   commands run in the config's directory), and it stops that server when it
 *   ends. It also fails fast when the server it started exits.
 * - The chosen origins are published as `E2E_<NAME>_URL` for the tests, and
 *   the app's own settings (such as `SITE_URL`) can follow them through `env`.
 *
 * Retries and the HTML report are on in CI.
 */
export async function createPlaywrightConfig({
  app,
  testDir = 'e2e',
  extraServers = [],
}: CreatePlaywrightConfigInput): Promise<PlaywrightTestConfig> {
  const isCI = Boolean(process.env.CI);
  const servers = [app, ...extraServers];

  if (!process.env[RESOLVED]) {
    const pinned = servers.map((server) => pinnedPort(server.name));
    const free = await freePorts(pinned.filter((port) => !port).length);
    servers.forEach((server, index) => {
      const port = pinned[index] ?? free.shift()!;
      process.env[portVariable(server.name)] = String(port);
      console.log(
        `[e2e] ${server.name}: http://localhost:${port}${pinned[index] ? ` (pinned by ${portVariable(server.name)})` : ''}`,
      );
    });
    process.env[RESOLVED] = '1';
  }

  const origins = new Map(
    servers.map((server) => [
      server.name,
      `http://localhost:${process.env[portVariable(server.name)]}`,
    ]),
  );
  const origin = (name: string) => {
    const found = origins.get(name);
    if (!found) throw new Error(`No e2e server named "${name}".`);
    return found;
  };
  for (const server of servers) {
    process.env[urlVariable(server.name)] = origin(server.name);
  }

  return defineConfig({
    testDir,
    testMatch: '**/*.e2e.ts',
    fullyParallel: true,
    forbidOnly: isCI,
    retries: isCI ? 2 : 0,
    reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
    use: { baseURL: origin(app.name), trace: 'on-first-retry' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: servers.map((server) => ({
      name: server.name,
      command: server.command(Number(process.env[portVariable(server.name)])),
      url: origin(server.name),
      env: server.env?.(origin),
      reuseExistingServer: false,
      timeout: 120_000,
    })),
  });
}
