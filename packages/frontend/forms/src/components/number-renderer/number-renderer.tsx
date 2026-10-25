'use client';

import type { Ref } from 'react';
import { Input } from '@synapcity/frontend-ui/core/input';

import type { FieldRendererProps } from '../../types';

/**
 * A number field, or a `range` slider over the same values. A cleared or unparsable entry is `undefined`, never `NaN`,
 * so an optional number validates as "not given".
 */
export function NumberRenderer({
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
  const isNumber = field.type === 'number' || field.type === 'range';
  const props = isNumber ? field.props : undefined;
  const shown =
    typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
  return (
    <Input
      ref={focusRef as Ref<HTMLInputElement>}
      id={id}
      name={field.name}
      type={field.type === 'range' ? 'range' : 'number'}
      inputMode={field.type === 'range' ? undefined : 'decimal'}
      value={shown}
      min={props?.min}
      max={props?.max}
      step={props?.step}
      onChange={(event) => {
        const text = event.target.value;
        const parsed = text.trim() === '' ? Number.NaN : Number(text);
        onChange(Number.isFinite(parsed) ? parsed : undefined);
      }}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
    />
  );
}
