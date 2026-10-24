import type { ErrorEvent } from '@sentry/browser';
import { vi, type Mock } from 'vitest';

type InitOptions = {
  beforeSend: (event: ErrorEvent) => ErrorEvent | null;
  [key: string]: unknown;
};

type Integration = { name: string };

export type FakeSentry = {
  /** How many times the client used the SDK; zero means it was never loaded. */
  imported: number;
  options: InitOptions | undefined;
  init: Mock<(options: InitOptions) => void>;
  close: Mock<() => Promise<boolean>>;
  getClient: () => object | undefined;
  captureException: Mock<(error: unknown) => void>;
  globalHandlersIntegration: () => Integration;
  linkedErrorsIntegration: () => Integration;
  dedupeIntegration: () => Integration;
};

/** A stand-in for `@sentry/browser` that records what the client asked of it. */
export function createFakeSentry(): FakeSentry {
  let client: object | undefined;
  const fake: FakeSentry = {
    imported: 0,
    options: undefined,
    init: vi.fn((options: InitOptions) => {
      fake.options = options;
      client = {};
    }),
    // Like the real one: flushes first, then unbinds.
    close: vi.fn(async () => {
      await Promise.resolve();
      client = undefined;
      return true;
    }),
    getClient: () => client,
    captureException: vi.fn(),
    globalHandlersIntegration: () => ({ name: 'GlobalHandlers' }),
    linkedErrorsIntegration: () => ({ name: 'LinkedErrors' }),
    dedupeIntegration: () => ({ name: 'Dedupe' }),
  };
  return fake;
}

/**
 * The mocked module. Vitest keeps a mocked module across `vi.resetModules()`,
 * so it forwards to whichever fake the current test made, and counts each use
 * as a sign that the SDK was loaded.
 */
export function forwardingModule(current: () => FakeSentry) {
  const loaded = () => {
    const sentry = current();
    sentry.imported++;
    return sentry;
  };
  return {
    init: (...args: Parameters<FakeSentry['init']>) => loaded().init(...args),
    close: () => loaded().close(),
    getClient: () => loaded().getClient(),
    captureException: (error: unknown) => loaded().captureException(error),
    globalHandlersIntegration: () => loaded().globalHandlersIntegration(),
    linkedErrorsIntegration: () => loaded().linkedErrorsIntegration(),
    dedupeIntegration: () => loaded().dedupeIntegration(),
  };
}
