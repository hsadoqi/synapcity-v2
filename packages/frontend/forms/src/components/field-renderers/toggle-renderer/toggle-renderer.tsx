'use client';

import type { Ref } from 'react';
import { Checkbox } from '@synapcity/frontend-ui/core/checkbox';
import { Switch } from '@synapcity/frontend-ui/core/switch';

import type { FieldRendererProps } from '../../../types';

/**
 * Checkbox and switch fields, emitting booleans. Base UI puts `id` on a hidden
 * native input and names the visible control itself, from the label that
 * targets that id.
 */
export function ToggleRenderer({
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
  const shared = {
    id,
    name: field.name,
    checked: value === true,
    onCheckedChange: (checked: boolean) => onChange(checked),
    onBlur,
    disabled,
    required,
    ref: focusRef as Ref<HTMLElement>,
    'aria-invalid': invalid || undefined,
    'aria-describedby': describedBy,
  };
  return field.type === 'switch' ? (
    <Switch {...shared} />
  ) : (
    <Checkbox {...shared} />
  );
}
