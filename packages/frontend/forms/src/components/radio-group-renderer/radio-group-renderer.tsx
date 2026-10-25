'use client';

import type { Ref } from 'react';

import { Label } from '@synapcity/frontend-ui/core/label';
import {
  RadioGroup,
  RadioGroupItem,
} from '@synapcity/frontend-ui/core/radio-group';

import type { FieldRendererProps } from '../../types';

/** One string value chosen from the radio field's declared options. */
export function RadioGroupRenderer({
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
  if (field.type !== 'radio') {
    throw new Error(
      `RadioGroupRenderer cannot render a field of type "${field.type}"`,
    );
  }

  return (
    <RadioGroup
      id={id}
      name={field.name}
      value={typeof value === 'string' ? value : ''}
      onValueChange={(next) => onChange(next)}
      onBlur={onBlur}
      disabled={disabled}
      required={required}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
      aria-labelledby={`${id}-label`}
    >
      {field.options.map((option, index) => {
        const optionId = `${id}-option-${index}`;
        return (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              id={optionId}
              value={option.value}
              ref={
                index === 0 ? (focusRef as Ref<HTMLButtonElement>) : undefined
              }
            />
            <Label htmlFor={optionId}>{option.label}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
