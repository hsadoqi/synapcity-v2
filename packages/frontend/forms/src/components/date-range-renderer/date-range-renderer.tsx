'use client';

import type { Ref } from 'react';
import { DateRangePicker } from '@synapcity/frontend-ui/core/date-picker';

import type { FieldRendererProps } from '../../types';
import {
  fromDateRangeValue,
  fromDateValue,
  toDateRangeValue,
} from '../../utils/date-value';

/**
 * A start and end day as `{ from, to }` local `yyyy-MM-dd` strings, posted as
 * `<name>.from` and `<name>.to`. Nothing picked is `undefined`.
 */
export function DateRangeRenderer({
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
  if (field.type !== 'date-range') {
    throw new Error(
      `DateRangeRenderer cannot render a field of type "${field.type}"`,
    );
  }
  return (
    <DateRangePicker
      ref={focusRef as Ref<HTMLButtonElement>}
      id={id}
      fromName={`${field.name}.from`}
      toName={`${field.name}.to`}
      value={fromDateRangeValue(value)}
      min={fromDateValue(field.props?.min)}
      max={fromDateValue(field.props?.max)}
      numberOfMonths={field.props?.numberOfMonths}
      disabled={disabled}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onBlur={onBlur}
      onValueChange={(range) => onChange(toDateRangeValue(range))}
    />
  );
}
