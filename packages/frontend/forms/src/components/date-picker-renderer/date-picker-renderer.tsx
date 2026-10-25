'use client';

import type { Ref } from 'react';
import { DatePicker } from '@synapcity/frontend-ui/core/date-picker';

import type { FieldRendererProps } from '../../types';
import { fromDateValue, toDateValue } from '../../utils/date-value';

/** Calendar-backed adapter for the form engine's yyyy-MM-dd date value. */
export function DatePickerRenderer({
  field,
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  required,
  describedBy,
  focusRef,
}: FieldRendererProps) {
  if (field.type !== 'date') {
    throw new Error(
      `DatePickerRenderer cannot render a field of type "${field.type}"`,
    );
  }

  return (
    <DatePicker
      id={id}
      name={field.name}
      value={fromDateValue(value)}
      min={fromDateValue(field.props?.min)}
      max={fromDateValue(field.props?.max)}
      step={field.props?.step}
      disabled={disabled}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      ref={focusRef as Ref<HTMLButtonElement>}
      onBlur={onBlur}
      onValueChange={(date) => onChange(toDateValue(date))}
    />
  );
}
