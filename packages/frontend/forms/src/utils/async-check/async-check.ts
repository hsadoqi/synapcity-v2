import type { AsyncFieldValidation } from '../../types';

export const ASYNC_DEFAULTS = {
  debounceMs: 400,
  timeoutMs: 8000,
  refusalTtlMs: 30_000,
  validating: 'Validating…',
  failed: 'Could not check this. Try again.',
} as const;

/**
 * How one async check ended. `failed` means the check threw or timed out: the
 * value is neither accepted nor refused, and submitting is blocked until a
 * retry succeeds. `aborted` means nobody wants the answer any more.
 */
export type AsyncCheckResult =
  | { readonly status: 'valid' }
  | { readonly status: 'invalid'; readonly message: string }
  | { readonly status: 'failed'; readonly message: string }
  | { readonly status: 'aborted' };

const VALID: AsyncCheckResult = { status: 'valid' };
const ABORTED: AsyncCheckResult = { status: 'aborted' };

/**
 * A stable key for a value, so the same value is checked once. A value that
 * cannot be keyed (a `File`, a function, a cycle) is never deduplicated.
 */
export function asyncCheckKey(value: unknown): string | undefined {
  return keyable(value) ? JSON.stringify(value) : undefined;
}

/**
 * Only plain data: primitives, arrays and plain objects all the way down.
 * Checked before stringifying because `JSON.stringify` would quietly turn a
 * `Date` into a string and a `File` into `{}`.
 */
function keyable(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null) return true;
  const type = typeof value;
  if (type === 'string' || type === 'boolean') return true;
  if (type === 'number') return Number.isFinite(value);
  if (type !== 'object' || seen.has(value)) return false;
  const isArray = Array.isArray(value);
  if (!isArray && Object.getPrototypeOf(value) !== Object.prototype)
    return false;
  seen.add(value);
  const children = isArray
    ? (value as unknown[])
    : Object.values(value as Record<string, unknown>);
  const ok = children.every((child) => keyable(child, seen));
  seen.delete(value);
  return ok;
}

/** Resolves to `aborted` as soon as `signal` aborts, else to what `promise` gives. */
function untilAborted(
  promise: Promise<AsyncCheckResult>,
  signal: AbortSignal,
): Promise<AsyncCheckResult> {
  if (signal.aborted) return Promise.resolve(ABORTED);
  return new Promise((resolve) => {
    const onAbort = () => resolve(ABORTED);
    signal.addEventListener('abort', onAbort, { once: true });
    void promise.then((result) => {
      signal.removeEventListener('abort', onAbort);
      resolve(result);
    });
  });
}

interface InFlight {
  readonly promise: Promise<AsyncCheckResult>;
  readonly controller: AbortController;
  waiters: number;
}

export interface AsyncChecker {
  /**
   * Checks a value. Aborting `signal` resolves this call to `aborted`; the
   * underlying check is aborted once no caller is waiting for it.
   */
  run(
    value: unknown,
    values: Readonly<Record<string, unknown>>,
    signal: AbortSignal,
  ): Promise<AsyncCheckResult>;
  /** The remembered answer for a value, if any. */
  cached(value: unknown): AsyncCheckResult | undefined;
}

/**
 * Runs a field's async check with a timeout, shares one in-flight check
 * between callers asking about the same value, and remembers accepted and
 * refused answers (the most recent `cacheSize`). Failed and aborted checks are
 * not remembered, so they run again. Pure: no React, no DOM.
 */
export function createAsyncChecker(
  validation: AsyncFieldValidation,
  { cacheSize = 50 }: { readonly cacheSize?: number } = {},
): AsyncChecker {
  const timeoutMs = validation.timeoutMs ?? ASYNC_DEFAULTS.timeoutMs;
  const failed: AsyncCheckResult = {
    status: 'failed',
    message: validation.messages?.failed ?? ASYNC_DEFAULTS.failed,
  };
  const refusalTtlMs = validation.refusalTtlMs ?? ASYNC_DEFAULTS.refusalTtlMs;
  const cache = new Map<
    string,
    { readonly result: AsyncCheckResult; readonly expires: number }
  >();
  const inFlight = new Map<string, InFlight>();

  const remember = (key: string, result: AsyncCheckResult) => {
    if (result.status !== 'valid' && result.status !== 'invalid') return;
    if (result.status === 'invalid' && refusalTtlMs <= 0) return;
    cache.delete(key);
    cache.set(key, {
      result,
      expires:
        result.status === 'invalid' ? Date.now() + refusalTtlMs : Infinity,
    });
    if (cache.size > cacheSize) cache.delete(cache.keys().next().value!);
  };

  const start = (
    value: unknown,
    values: Readonly<Record<string, unknown>>,
  ): InFlight => {
    const controller = new AbortController();
    let timedOut = false;
    const promise = new Promise<AsyncCheckResult>((resolve) => {
      const timer = setTimeout(() => {
        timedOut = true;
        resolve(failed);
        controller.abort();
      }, timeoutMs);
      controller.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          if (!timedOut) resolve(ABORTED);
        },
        { once: true },
      );
      Promise.resolve()
        .then(() =>
          validation.check(value, { signal: controller.signal, values }),
        )
        .then(
          (message) => {
            clearTimeout(timer);
            resolve(
              message === undefined ? VALID : { status: 'invalid', message },
            );
          },
          () => {
            clearTimeout(timer);
            // The thrown error's text never reaches the person filling the form.
            resolve(controller.signal.aborted && !timedOut ? ABORTED : failed);
          },
        );
    });
    return { promise, controller, waiters: 0 };
  };

  /** The remembered answer for a key, dropping it if a refusal has expired. */
  const recall = (key: string): AsyncCheckResult | undefined => {
    const entry = cache.get(key);
    if (entry === undefined) return undefined;
    if (entry.expires <= Date.now()) {
      cache.delete(key);
      return undefined;
    }
    return entry.result;
  };

  return {
    cached(value) {
      const key = asyncCheckKey(value);
      return key === undefined ? undefined : recall(key);
    },

    run(value, values, signal) {
      const key = asyncCheckKey(value);
      if (key !== undefined) {
        const known = recall(key);
        if (known) return Promise.resolve(known);
      }
      if (signal.aborted) return Promise.resolve(ABORTED);

      let entry = key === undefined ? undefined : inFlight.get(key);
      if (entry === undefined) {
        entry = start(value, values);
        const created = entry;
        if (key !== undefined) {
          inFlight.set(key, created);
          void created.promise.then((result) => {
            if (inFlight.get(key) === created) inFlight.delete(key);
            remember(key, result);
          });
        }
      }
      const current = entry;
      current.waiters += 1;
      const release = () => {
        current.waiters -= 1;
        if (current.waiters === 0) current.controller.abort();
      };
      signal.addEventListener('abort', release, { once: true });
      void current.promise.then(() =>
        signal.removeEventListener('abort', release),
      );
      return untilAborted(current.promise, signal);
    },
  };
}
