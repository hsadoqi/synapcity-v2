'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { AsyncFieldValidation } from '../../types';
import {
  ASYNC_DEFAULTS,
  asyncCheckKey,
  createAsyncChecker,
  type AsyncCheckResult,
} from '../../utils/async-check';

export type AsyncValidationStatus =
  'idle' | 'validating' | 'valid' | 'invalid' | 'failed';

export interface UseAsyncValidationOptions {
  readonly validation?: AsyncFieldValidation;
  readonly value: unknown;
  /**
   * Whether the value is worth checking: the field is shown and enabled, the
   * value is not empty, and the field's own schema accepts it. While false,
   * nothing runs and the status is `idle`.
   */
  readonly ready: boolean;
  readonly getValues: () => Readonly<Record<string, unknown>>;
  /** Called just before a check starts, so a caller can note where focus is. */
  readonly onStart?: () => void;
}

export interface UseAsyncValidationResult {
  readonly status: AsyncValidationStatus;
  /** The refusal (`invalid`) or the failure message (`failed`). */
  readonly message?: string;
  /**
   * Checks the current value now, skipping the debounce, and resolves with the
   * answer; a check already running for the value is joined, not repeated.
   * `undefined` when there is nothing to check.
   */
  readonly flush: () => Promise<AsyncCheckResult | undefined>;
}

interface Outcome {
  readonly value: unknown;
  readonly status: Exclude<AsyncValidationStatus, 'idle'>;
  readonly message?: string;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  const key = asyncCheckKey(a);
  return key !== undefined && key === asyncCheckKey(b);
}

function toOutcome(value: unknown, result: AsyncCheckResult): Outcome | null {
  if (result.status === 'aborted') return null;
  return result.status === 'valid'
    ? { value, status: 'valid' }
    : { value, status: result.status, message: result.message };
}

/**
 * One field's async check: debounced after each change, aborted when the value
 * changes again or the field unmounts, deduplicated and remembered by value,
 * and limited by the check's timeout. The status always describes the current
 * value; an answer that arrives for an older value is dropped.
 */
export function useAsyncValidation({
  validation,
  value,
  ready,
  getValues,
  onStart,
}: UseAsyncValidationOptions): UseAsyncValidationResult {
  const checker = useMemo(
    () => (validation ? createAsyncChecker(validation) : undefined),
    [validation],
  );
  const debounceMs = validation?.debounceMs ?? ASYNC_DEFAULTS.debounceMs;
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const latest = useRef({ value, ready });
  const controller = useRef<AbortController | null>(null);
  const pending = useRef<{
    readonly value: unknown;
    readonly promise: Promise<AsyncCheckResult>;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settled = useRef<Outcome | null>(null);
  const callbacks = useRef({ getValues, onStart });

  useEffect(() => {
    callbacks.current = { getValues, onStart };
  });

  const start = useCallback(
    (target: unknown): Promise<AsyncCheckResult> => {
      if (checker === undefined) return Promise.resolve({ status: 'valid' });
      const known = checker.cached(target);
      if (known) {
        const next = toOutcome(target, known);
        settled.current = next;
        setOutcome(next);
        return Promise.resolve(known);
      }
      controller.current?.abort();
      const own = new AbortController();
      controller.current = own;
      callbacks.current.onStart?.();
      setOutcome({ value: target, status: 'validating' });
      const promise = checker
        .run(target, callbacks.current.getValues(), own.signal)
        .then((result) => {
          if (controller.current === own) {
            controller.current = null;
            pending.current = null;
            const next = toOutcome(target, result);
            settled.current = next;
            setOutcome(next);
          }
          return result;
        });
      pending.current = { value: target, promise };
      return promise;
    },
    [checker],
  );

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    controller.current?.abort();
    controller.current = null;
    pending.current = null;
  }, []);

  useEffect(() => {
    latest.current = { value, ready };
    if (checker === undefined || !ready) return undefined;
    timer.current = setTimeout(() => {
      timer.current = null;
      void start(value);
    }, debounceMs);
    return cancel;
  }, [checker, value, ready, debounceMs, start, cancel]);

  const flush = useCallback(async () => {
    const current = latest.current;
    if (checker === undefined || !current.ready) return undefined;
    const done = settled.current;
    if (
      done !== null &&
      done.status !== 'failed' &&
      done.status !== 'validating' &&
      sameValue(done.value, current.value)
    ) {
      return done.status === 'valid'
        ? ({ status: 'valid' } as const)
        : ({ status: 'invalid', message: done.message ?? '' } as const);
    }
    if (pending.current && sameValue(pending.current.value, current.value)) {
      return pending.current.promise;
    }
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    return start(current.value);
  }, [checker, start]);

  const current =
    ready && outcome !== null && sameValue(outcome.value, value)
      ? outcome
      : null;

  return {
    status: current?.status ?? 'idle',
    message: current?.message,
    flush,
  };
}
