'use client';

import { createElement, useCallback, useEffect, useRef } from 'react';
import { useController, type Control, type FieldValues } from 'react-hook-form';
import type { z } from 'zod';

import type { FieldConfig, FieldState } from '../../types';
import type { FieldRendererRegistry } from '../../providers/field-renderer-provider';
import { useAsyncValidation } from '../../hooks/use-async-validation';
import { ASYNC_DEFAULTS, type AsyncCheckResult } from '../../utils/async-check';
import { isEmptyValue } from '../../utils/is-empty-value';
import { FieldFrame, fieldDescribedBy } from '../field-frame';

/**
 * Controls whose element cannot carry `aria-required` (a button, a colour
 * input): their requirement is read through `aria-describedby` instead.
 */
const SPOKEN_REQUIRED = new Set(['date', 'date-range', 'color']);

export type AsyncFlush = () => Promise<AsyncCheckResult | undefined>;

export interface EngineFieldProps {
  readonly field: FieldConfig;
  readonly id: string;
  readonly state: FieldState;
  readonly control: Control<FieldValues>;
  readonly registry: FieldRendererRegistry;
  /** The field's own schema key, so an async check runs only on a value it accepts. */
  readonly schema: z.ZodType;
  readonly getValues: () => Readonly<Record<string, unknown>>;
  /** `false` hides the field's own schema error line (a server action shows its refusal instead). */
  readonly showOwnError: boolean;
  /** Marks the field invalid even without its own error (a server refusal names it). */
  readonly markedBy?: string;
  /** Spoken for a required control that cannot carry `aria-required`. */
  readonly requiredHint: string;
  /** The form is submitting: every control is disabled until it finishes. */
  readonly locked: boolean;
  readonly onFocusTarget: (name: string, element: HTMLElement | null) => void;
  /** Registers how to run the field's async check now, for submit; `null` unregisters. */
  readonly onAsyncFlush?: (name: string, flush: AsyncFlush | null) => void;
}

/**
 * One field: React Hook Form's controller for its value, the registered
 * renderer for the control, the field's async check if it has one, and the
 * frame for its label, description, status and error. `disabled` goes to the
 * renderer only: passed to the controller, React Hook Form would drop the
 * field's value from what is submitted.
 */
export function EngineField({
  field,
  id,
  state,
  control,
  registry,
  schema,
  getValues,
  showOwnError,
  markedBy,
  requiredHint,
  locked,
  onFocusTarget,
  onAsyncFlush,
}: EngineFieldProps) {
  const { field: bound, fieldState } = useController({
    control,
    name: field.name,
  });
  const validation = field.asyncValidation;
  const hadFocus = useRef(false);

  const ready =
    validation !== undefined &&
    state.visible &&
    state.enabled &&
    !isEmptyValue(bound.value) &&
    schema.safeParse(bound.value).success;

  const async = useAsyncValidation({
    validation,
    value: bound.value,
    ready,
    getValues,
    onStart: () => {
      // The control carries the field's id (a radio group holds its focused item).
      const control = document.getElementById(id);
      hadFocus.current =
        control !== null && control.contains(document.activeElement);
    },
  });
  const validating = async.status === 'validating';
  // A background check leaves the field editable unless the field asks otherwise.
  const lockWhileValidating =
    validating && validation?.disableWhileValidating === true;

  // Disabling the control drops focus; give it back once the check is done.
  useEffect(() => {
    if (validating || !hadFocus.current) return;
    hadFocus.current = false;
    document.getElementById(id)?.focus();
  }, [validating, id]);

  const { flush } = async;
  useEffect(() => {
    if (validation === undefined || onAsyncFlush === undefined)
      return undefined;
    onAsyncFlush(field.name, flush);
    return () => onAsyncFlush(field.name, null);
  }, [validation, onAsyncFlush, field.name, flush]);

  const schemaError = showOwnError ? fieldState.error?.message : undefined;
  const asyncError =
    async.status === 'invalid' || async.status === 'failed'
      ? async.message
      : undefined;
  // The schema's rule comes first: an async refusal is only shown for a value the schema accepts.
  const error = schemaError ?? asyncError;
  const invalid = error !== undefined || markedBy !== undefined;
  const spokenRequired = state.required && SPOKEN_REQUIRED.has(field.type);
  const ownDescribedBy = fieldDescribedBy(id, {
    description: field.description !== undefined,
    error: error !== undefined,
    requiredHint: spokenRequired,
  });
  const describedBy =
    [ownDescribedBy, markedBy].filter(Boolean).join(' ') || undefined;

  const { ref: bindRef } = bound;
  const focusRef = useCallback(
    (node: HTMLElement | null) => {
      bindRef(node);
      onFocusTarget(field.name, node);
    },
    [bindRef, onFocusTarget, field.name],
  );

  return (
    <FieldFrame
      id={id}
      label={field.label}
      description={field.description}
      error={error}
      required={state.required}
      requiredHint={spokenRequired ? requiredHint : undefined}
      live={validation !== undefined}
      status={
        validating
          ? (validation?.messages?.validating ?? ASYNC_DEFAULTS.validating)
          : undefined
      }
      orientation={
        field.type === 'checkbox' || field.type === 'switch'
          ? 'horizontal'
          : 'vertical'
      }
    >
      {createElement(registry.resolve(field.type), {
        field,
        id,
        value: bound.value,
        onChange: bound.onChange,
        onBlur: bound.onBlur,
        invalid,
        disabled: !state.enabled || locked || lockWhileValidating,
        required: state.required,
        describedBy,
        focusRef,
      })}
    </FieldFrame>
  );
}
