'use client';

import type { Ref } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import { Input } from '@synapcity/frontend-ui/core/input';

import type { FieldRendererProps } from '../../types';
import { toTimeValue } from '../../utils/time-value';

/**
 * A time of day, `HH:mm` (`HH:mm:ss` for a step under a minute); nothing chosen
 * is `''`. The native control gives the best keyboard and touch input, so it is
 * used as is; what it adds here is a value that is always valid (anything else
 * shows as empty) and a Clear control for an optional field, because browsers
 * differ on whether they offer one.
 */
export function TimeRenderer({
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
  if (field.type !== 'time') {
    throw new Error(
      `TimeRenderer cannot render a field of type "${field.type}"`,
    );
  }
  const chosen = toTimeValue(value);

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={focusRef as Ref<HTMLInputElement>}
        id={id}
        name={field.name}
        type="time"
        className="w-32"
        value={chosen}
        min={field.props?.min}
        max={field.props?.max}
        step={field.props?.step}
        autoComplete={field.props?.autoComplete}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
      />
      {!required && chosen !== '' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={`Clear ${field.label}`}
          onClick={() => onChange('')}
        >
          Clear
        </Button>
      ) : null}
    </div>
  );
}
