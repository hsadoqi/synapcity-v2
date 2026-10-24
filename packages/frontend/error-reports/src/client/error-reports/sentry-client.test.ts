import type { ErrorEvent } from '@sentry/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeSentry, type FakeSentry } from './fake-sentry';

const fake = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock('@sentry/browser', async () =>
  (await import('./fake-sentry')).forwardingModule(
    () => fake.current as FakeSentry,
  ),
);

let sentry: FakeSentry;
let client: typeof import('./sentry-client');
const config = {
  dsn: 'https://key@o1.ingest.sentry.io/1',
  environment: 'test',
  release: 'abc123',
};

beforeEach(async () => {
  vi.resetModules();
  sentry = createFakeSentry();
  fake.current = sentry;
  client = await import('./sentry-client');
});
afterEach(() => vi.unstubAllEnvs());

const userId = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const event = (): ErrorEvent => ({
  type: undefined,
  user: { id: userId },
  request: { url: `https://app.example/${userId}/settings?code=x` },
});

describe('error reports client', () => {
  it('downloads nothing until reports are started', async () => {
    client.reportCaughtError(new Error('ignored'));
    client.stopErrorReports();
    await Promise.resolve();
    expect(sentry.imported).toBe(0);
  });

  it('does nothing without a DSN', async () => {
    client.startErrorReports({ ...config, dsn: '' });
    await new Promise((resolve) => setTimeout(resolve));
    expect(sentry.imported).toBe(0);
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it('starts with errors only and nothing that identifies the person', async () => {
    client.startErrorReports(config);
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledOnce());

    expect(sentry.options).toMatchObject({
      dsn: config.dsn,
      defaultIntegrations: false,
      maxBreadcrumbs: 0,
      sendClientReports: false,
      dataCollection: { userInfo: false, cookies: false },
    });
    expect(
      (sentry.options!.integrations as { name: string }[]).map((i) => i.name),
    ).toEqual(['GlobalHandlers', 'LinkedErrors', 'Dedupe']);
    expect(sentry.options!.beforeSend(event())).toEqual({
      type: undefined,
      request: { url: 'https://app.example/:id/settings' },
    });
  });

  it('labels reports with the Vercel environment and commit, or NODE_ENV', async () => {
    client.startErrorReports({ ...config, environment: 'preview' });
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledOnce());
    expect(sentry.options).toMatchObject({
      environment: 'preview',
      release: 'abc123',
    });
  });

  it('falls back to NODE_ENV outside Vercel', async () => {
    client.startErrorReports({ ...config, environment: 'development' });
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledOnce());
    expect(sentry.options!.environment).toBe('development');
  });

  it('drops events at once when stopped, then closes the client', async () => {
    client.startErrorReports(config);
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalled());

    client.stopErrorReports();

    expect(sentry.options!.beforeSend(event())).toBeNull();
    await vi.waitFor(() => expect(sentry.close).toHaveBeenCalledOnce());
    expect(sentry.getClient()).toBeUndefined();
  });

  it('ends up running after off and on again in quick succession', async () => {
    client.startErrorReports(config);
    client.stopErrorReports();
    client.startErrorReports(config);

    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledTimes(2));
    expect(sentry.close).toHaveBeenCalledOnce();
    expect(sentry.getClient()).toBeDefined();
  });

  it('reports caught errors only while running', async () => {
    const first = new Error('before');
    client.reportCaughtError(first);
    client.startErrorReports(config);
    const second = new Error('while on');
    client.reportCaughtError(second);

    await vi.waitFor(() =>
      expect(sentry.captureException).toHaveBeenCalledWith(second),
    );
    expect(sentry.captureException).not.toHaveBeenCalledWith(first);
  });
});
