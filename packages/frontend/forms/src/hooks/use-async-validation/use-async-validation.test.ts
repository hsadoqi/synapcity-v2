import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AsyncFieldValidation } from '../../types';
import { useAsyncValidation } from './use-async-validation';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A check the test answers by hand, value by value. */
function manual() {
  const calls: {
    value: unknown;
    signal: AbortSignal;
    answer: (message?: string) => void;
  }[] = [];
  const validation: AsyncFieldValidation = {
    debounceMs: 300,
    check: vi.fn(
      (value: unknown, { signal }: { signal: AbortSignal }) =>
        new Promise<string | undefined>((resolve) => {
          calls.push({ value, signal, answer: resolve });
        }),
    ),
  };
  return { validation, calls };
}

const setup = (
  validation: AsyncFieldValidation | undefined,
  initial: { value: unknown; ready: boolean } = { value: 'ada', ready: true },
) => {
  const onStart = vi.fn();
  const hook = renderHook(
    ({ value, ready }) =>
      useAsyncValidation({
        validation,
        value,
        ready,
        getValues: () => ({ handle: value }),
        onStart,
      }),
    { initialProps: initial },
  );
  return { ...hook, onStart };
};

describe('useAsyncValidation', () => {
  it('waits for the debounce, then shows validating until the answer arrives', async () => {
    const { validation, calls } = manual();
    const { result, onStart } = setup(validation);

    expect(result.current.status).toBe('idle');
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(calls).toHaveLength(0);

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(result.current.status).toBe('validating');
    expect(onStart).toHaveBeenCalledTimes(1);

    await act(async () => calls[0]?.answer('Taken.'));
    expect(result.current).toMatchObject({
      status: 'invalid',
      message: 'Taken.',
    });
  });

  it('restarts the debounce on each change and checks only the last value', async () => {
    const { validation, calls } = manual();
    const { rerender } = setup(validation, { value: 'a', ready: true });

    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender({ value: 'ab', ready: true });
    await act(() => vi.advanceTimersByTimeAsync(200));
    rerender({ value: 'abc', ready: true });
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(calls.map((call) => call.value)).toEqual(['abc']);
  });

  it('aborts a running check when the value changes and drops its late answer', async () => {
    const { validation, calls } = manual();
    const { result, rerender } = setup(validation, {
      value: 'old',
      ready: true,
    });

    await act(() => vi.advanceTimersByTimeAsync(300));
    rerender({ value: 'new', ready: true });

    expect(calls[0]?.signal.aborted).toBe(true);
    expect(result.current.status).toBe('idle');
    await act(async () => calls[0]?.answer('Old refusal.'));
    expect(result.current.status).toBe('idle');
  });

  it('does nothing while not ready, and stays idle', async () => {
    const { validation, calls } = manual();
    const { result } = setup(validation, { value: '', ready: false });

    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(calls).toHaveLength(0);
    expect(result.current.status).toBe('idle');
    await expect(result.current.flush()).resolves.toBeUndefined();
  });

  it('flushes at once without waiting for the debounce', async () => {
    const { validation, calls } = manual();
    const { result } = setup(validation);

    let answer: Promise<unknown> | undefined;
    await act(async () => {
      answer = result.current.flush();
    });
    // Started straight away, long before the 300 ms debounce.
    expect(calls).toHaveLength(1);
    await act(async () => calls[0]?.answer(undefined));

    await expect(answer).resolves.toEqual({ status: 'valid' });
    expect(result.current.status).toBe('valid');
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(calls).toHaveLength(1);
  });

  it('joins a check already running for the value instead of starting another', async () => {
    const { validation, calls } = manual();
    const { result } = setup(validation);

    await act(() => vi.advanceTimersByTimeAsync(300));
    let joined: Promise<unknown> | undefined;
    act(() => {
      joined = result.current.flush();
    });
    await act(async () => calls[0]?.answer('Taken.'));

    expect(calls).toHaveLength(1);
    await expect(joined).resolves.toEqual({
      status: 'invalid',
      message: 'Taken.',
    });
  });

  it('answers a flush from a settled result without checking again', async () => {
    const { validation, calls } = manual();
    const { result } = setup(validation);
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(async () => calls[0]?.answer('Taken.'));

    await expect(result.current.flush()).resolves.toEqual({
      status: 'invalid',
      message: 'Taken.',
    });
    expect(calls).toHaveLength(1);
  });

  it('shows a remembered answer for a value seen before without a validating flash', async () => {
    const { validation, calls } = manual();
    const { result, rerender, onStart } = setup(validation, {
      value: 'ada',
      ready: true,
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(async () => calls[0]?.answer('Taken.'));
    rerender({ value: 'bob', ready: true });
    rerender({ value: 'ada', ready: true });

    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(calls).toHaveLength(1);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      status: 'invalid',
      message: 'Taken.',
    });
  });

  it('reports a timeout as failed with the failure message', async () => {
    const { validation } = manual();
    const { result } = setup({ ...validation, timeoutMs: 1000 });

    await act(() => vi.advanceTimersByTimeAsync(300));
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(result.current).toMatchObject({
      status: 'failed',
      message: 'Could not check this. Try again.',
    });
  });

  it('retries a failed check when flushed', async () => {
    let attempts = 0;
    const validation: AsyncFieldValidation = {
      check: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error('offline');
        return undefined;
      },
    };
    const { result } = setup(validation);
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(result.current.status).toBe('failed');

    await act(async () => {
      await result.current.flush();
    });

    expect(result.current.status).toBe('valid');
    expect(attempts).toBe(2);
  });

  it('aborts a running check on unmount', async () => {
    const { validation, calls } = manual();
    const { unmount } = setup(validation);
    await act(() => vi.advanceTimersByTimeAsync(300));

    unmount();

    expect(calls[0]?.signal.aborted).toBe(true);
  });

  it('is inert without a validation', async () => {
    const { result } = setup(undefined);
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(result.current.status).toBe('idle');
    await expect(result.current.flush()).resolves.toBeUndefined();
  });
});
