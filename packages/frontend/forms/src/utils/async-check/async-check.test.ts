import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AsyncFieldValidation } from '../../types';
import { asyncCheckKey, createAsyncChecker } from './async-check';

const live = () => new AbortController().signal;

/** A check whose answers the test hands out by hand. */
function deferredCheck() {
  const calls: {
    value: unknown;
    signal: AbortSignal;
    resolve: (message: string | undefined) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const check = vi.fn(
    (value: unknown, { signal }: { signal: AbortSignal }) =>
      new Promise<string | undefined>((resolve, reject) => {
        calls.push({ value, signal, resolve, reject });
      }),
  );
  return { check, calls };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('asyncCheckKey', () => {
  it('keys primitives, arrays and plain objects', () => {
    expect(asyncCheckKey('ada')).toBe('"ada"');
    expect(asyncCheckKey(3)).toBe('3');
    expect(asyncCheckKey(['a', 'b'])).toBe('["a","b"]');
    expect(asyncCheckKey({ from: '2026-01-01' })).toBe('{"from":"2026-01-01"}');
  });

  it('refuses values it cannot key safely', () => {
    expect(asyncCheckKey(new File(['x'], 'x.txt'))).toBeUndefined();
    expect(asyncCheckKey([new Date()])).toBeUndefined();
    expect(asyncCheckKey(undefined)).toBeUndefined();
    expect(asyncCheckKey(Number.NaN)).toBeUndefined();
    const cycle: Record<string, unknown> = {};
    cycle.self = cycle;
    expect(asyncCheckKey(cycle)).toBeUndefined();
  });
});

describe('createAsyncChecker', () => {
  it('maps the check answer to valid or invalid', async () => {
    const checker = createAsyncChecker({
      check: async (value) =>
        value === 'taken' ? 'That name is taken.' : undefined,
    });

    await expect(checker.run('free', {}, live())).resolves.toEqual({
      status: 'valid',
    });
    await expect(checker.run('taken', {}, live())).resolves.toEqual({
      status: 'invalid',
      message: 'That name is taken.',
    });
  });

  it('passes the form values and an abort signal to the check', async () => {
    const check = vi.fn(async () => undefined);
    const checker = createAsyncChecker({ check });

    await checker.run('ada', { team: 'core' }, live());

    expect(check).toHaveBeenCalledWith('ada', {
      signal: expect.any(AbortSignal),
      values: { team: 'core' },
    });
  });

  it('fails with the configured message, never the error text, when the check throws', async () => {
    const checker = createAsyncChecker({
      check: async () => {
        throw new Error('secret connection string');
      },
      messages: { failed: 'Try again later.' },
    });

    await expect(checker.run('x', {}, live())).resolves.toEqual({
      status: 'failed',
      message: 'Try again later.',
    });
  });

  it('times out, aborts the check and fails', async () => {
    const { check, calls } = deferredCheck();
    const checker = createAsyncChecker({ check, timeoutMs: 1000 });

    const result = checker.run('slow', {}, live());
    await vi.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toEqual({
      status: 'failed',
      message: 'Could not check this. Try again.',
    });
    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it('shares one in-flight check between callers asking about the same value', async () => {
    const { check, calls } = deferredCheck();
    const checker = createAsyncChecker({ check });

    const first = checker.run('ada', {}, live());
    const second = checker.run('ada', {}, live());
    await vi.advanceTimersByTimeAsync(0);
    calls[0]?.resolve(undefined);

    await expect(first).resolves.toEqual({ status: 'valid' });
    await expect(second).resolves.toEqual({ status: 'valid' });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('remembers accepted and refused answers but retries failures', async () => {
    let flakyAttempts = 0;
    const check = vi.fn(async (value: unknown) => {
      if (value === 'flaky' && ++flakyAttempts === 1)
        throw new Error('offline');
      return value === 'taken' ? 'Taken.' : undefined;
    });
    const checker = createAsyncChecker({ check });

    await checker.run('taken', {}, live());
    await checker.run('taken', {}, live());
    expect(check).toHaveBeenCalledTimes(1);
    expect(checker.cached('taken')).toEqual({
      status: 'invalid',
      message: 'Taken.',
    });

    await expect(checker.run('flaky', {}, live())).resolves.toMatchObject({
      status: 'failed',
    });
    await expect(checker.run('flaky', {}, live())).resolves.toEqual({
      status: 'valid',
    });
    expect(check).toHaveBeenCalledTimes(3);
  });

  it('forgets the oldest answer once the cache is full', async () => {
    const check = vi.fn(async () => undefined);
    const checker = createAsyncChecker({ check }, { cacheSize: 2 });

    await checker.run('a', {}, live());
    await checker.run('b', {}, live());
    await checker.run('c', {}, live());

    expect(checker.cached('a')).toBeUndefined();
    expect(checker.cached('c')).toEqual({ status: 'valid' });
  });

  it('resolves an aborted caller at once and aborts the check when nobody waits', async () => {
    const { check, calls } = deferredCheck();
    const checker = createAsyncChecker({ check });
    const controller = new AbortController();

    const result = checker.run('ada', {}, controller.signal);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();

    await expect(result).resolves.toEqual({ status: 'aborted' });
    expect(calls[0]?.signal.aborted).toBe(true);
    expect(checker.cached('ada')).toBeUndefined();
  });

  it('keeps a shared check running while another caller still waits', async () => {
    const { check, calls } = deferredCheck();
    const checker = createAsyncChecker({ check });
    const leaving = new AbortController();

    const gone = checker.run('ada', {}, leaving.signal);
    const staying = checker.run('ada', {}, live());
    await vi.advanceTimersByTimeAsync(0);
    leaving.abort();
    calls[0]?.resolve('Taken.');

    await expect(gone).resolves.toEqual({ status: 'aborted' });
    await expect(staying).resolves.toEqual({
      status: 'invalid',
      message: 'Taken.',
    });
    expect(calls[0]?.signal.aborted).toBe(false);
  });

  it('never deduplicates a value it cannot key', async () => {
    const check = vi.fn(async () => undefined);
    const checker = createAsyncChecker({
      check,
    } satisfies AsyncFieldValidation);
    const file = new File(['x'], 'x.txt');

    await checker.run(file, {}, live());
    await checker.run(file, {}, live());

    expect(check).toHaveBeenCalledTimes(2);
  });

  it('answers an already-aborted caller without running the check', async () => {
    const check = vi.fn(async () => undefined);
    const checker = createAsyncChecker({ check });
    const controller = new AbortController();
    controller.abort();

    await expect(checker.run('x', {}, controller.signal)).resolves.toEqual({
      status: 'aborted',
    });
    expect(check).not.toHaveBeenCalled();
  });
});
