'use client';

import type { Ref } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@synapcity/frontend-ui/core/select';

import type { FieldRendererProps } from '../../types';

/** A select field emitting the chosen option's value; nothing chosen is `undefined`. */
export function SelectRenderer({
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
  const options = field.type === 'select' ? field.options : [];
  const placeholder =
    field.type === 'select' ? field.props?.placeholder : undefined;
  const chosen =
    typeof value === 'string' &&
    options.some((option) => option.value === value)
      ? value
      : null;
  return (
    <Select
      name={field.name}
      items={options}
      value={chosen}
      onValueChange={(next) => onChange(next ?? undefined)}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        ref={focusRef as Ref<HTMLButtonElement>}
        id={id}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
