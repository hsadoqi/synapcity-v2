import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRIVACY_POLICY_VERSION } from '@/features/settings/types/data-privacy';
import { createFakeSentry, type FakeSentry } from './fake-sentry';

const fake = vi.hoisted(() => ({ current: undefined as unknown }));
vi.mock('@sentry/browser', async () =>
  (await import('./fake-sentry')).forwardingModule(
    () => fake.current as FakeSentry,
  ),
);

const KEY = 'synapcity-preferences';
const save = (granted: boolean) => {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      privacy: {
        errorReports: { granted, updatedAt: null },
        policyVersion: PRIVACY_POLICY_VERSION,
      },
    }),
  );
  window.dispatchEvent(new StorageEvent('storage', { key: KEY }));
};

let sentry: FakeSentry;
let ErrorReports: typeof import('./error-reports').ErrorReports;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  sentry = createFakeSentry();
  fake.current = sentry;
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://key@o1.ingest.sentry.io/1');
  ({ ErrorReports } = await import('./error-reports'));
});
afterEach(() => vi.unstubAllEnvs());

describe('ErrorReports', () => {
  it('loads nothing while error reports are off', async () => {
    render(<ErrorReports />);
    await new Promise((resolve) => setTimeout(resolve));
    expect(sentry.imported).toBe(0);
  });

  it('starts when they are turned on and stops when turned off', async () => {
    render(<ErrorReports />);

    act(() => save(true));
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledOnce());

    act(() => save(false));
    await vi.waitFor(() => expect(sentry.close).toHaveBeenCalledOnce());
  });

  it('keeps reporting after it unmounts, for global-error', async () => {
    save(true);
    const view = render(<ErrorReports />);
    await vi.waitFor(() => expect(sentry.init).toHaveBeenCalledOnce());

    view.unmount();
    await new Promise((resolve) => setTimeout(resolve));
    expect(sentry.close).not.toHaveBeenCalled();
  });
});
