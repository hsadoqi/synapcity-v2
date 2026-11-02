'use client';

import type { Ref } from 'react';
import { TagsInput } from '@synapcity/frontend-ui/core/tags-input';

import type { FieldRendererProps } from '../../../types';

const asTags = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === 'string')
    : [];

/** A list of free-text tags; nothing entered is `[]`. Each tag is posted under the field's name. */
export function TagsRenderer({
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
  if (field.type !== 'tags') {
    throw new Error(
      `TagsRenderer cannot render a field of type "${field.type}"`,
    );
  }
  return (
    <TagsInput
      ref={focusRef as Ref<HTMLInputElement>}
      id={id}
      name={field.name}
      value={asTags(value)}
      onValueChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={field.props?.placeholder}
      maxTags={field.props?.maxTags}
      maxLength={field.props?.maxLength}
      allowDuplicates={field.props?.allowDuplicates}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
    />
  );
}
