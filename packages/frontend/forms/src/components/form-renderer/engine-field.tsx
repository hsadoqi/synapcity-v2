'use client';

import { createElement } from 'react';
import { useController, type Control, type FieldValues } from 'react-hook-form';

import type { FieldConfig, FieldState } from '../../types';
import type { FieldRendererRegistry } from '../../providers/field-renderer-provider';
import { FieldFrame, fieldDescribedBy } from '../field-frame';

export interface EngineFieldProps {
  readonly field: FieldConfig;
  readonly id: string;
  readonly state: FieldState;
  readonly control: Control<FieldValues>;
  readonly registry: FieldRendererRegistry;
  /** Shown under the field; `undefined` hides the field's own error line. */
  readonly showOwnError: boolean;
  /** Marks the field invalid even without its own error (a server refusal names it). */
  readonly markedBy?: string;
  readonly onFocusTarget: (name: string, element: HTMLElement | null) => void;
}

/**
 * One field: React Hook Form's controller for its value, the registered
 * renderer for the control, and the frame for its label, description and
 * error. `disabled` goes to the renderer only: passed to the controller,
 * React Hook Form would drop the field's value from what is submitted.
 */
export function EngineField({
  field,
  id,
  state,
  control,
  registry,
  showOwnError,
  markedBy,
  onFocusTarget,
}: EngineFieldProps) {
  const { field: bound, fieldState } = useController({
    control,
    name: field.name,
  });
  const error = showOwnError ? fieldState.error?.message : undefined;
  const invalid = error !== undefined || markedBy !== undefined;
  const ownDescribedBy = fieldDescribedBy(id, {
    description: field.description !== undefined,
    error: error !== undefined,
  });
  const describedBy =
    [ownDescribedBy, markedBy].filter(Boolean).join(' ') || undefined;

  return (
    <FieldFrame
      id={id}
      label={field.label}
      description={field.description}
      error={error}
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
        disabled: !state.enabled,
        required: state.required,
        describedBy,
        focusRef: (element: HTMLElement | null) => {
          bound.ref(element);
          onFocusTarget(field.name, element);
        },
      })}
    </FieldFrame>
  );
}
