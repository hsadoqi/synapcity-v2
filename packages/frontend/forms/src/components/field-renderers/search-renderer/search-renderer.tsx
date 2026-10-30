'use client';

import type { Ref } from 'react';

import type { FieldRendererProps } from '../../../types';
import { SearchInput } from '../../search-field';

/**
 * A search box as a form field: the search input with its magnifier. The
 * form owns the label, hint and error, so this is only the control. A value
 * that is not a string shows as empty. Escape clears the text in browsers
 * that support it on search inputs.
 */
export function SearchRenderer({
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
  if (field.type !== 'search') {
    throw new Error(
      `SearchRenderer cannot render a field of type "${field.type}"`,
    );
  }

  return (
    <SearchInput
      ref={focusRef as Ref<HTMLInputElement>}
      id={id}
      name={field.name}
      value={typeof value === 'string' ? value : ''}
      inputMode={field.props?.inputMode ?? 'search'}
      autoComplete={field.props?.autoComplete}
      placeholder={field.props?.placeholder}
      minLength={field.props?.minLength}
      maxLength={field.props?.maxLength}
      pattern={field.props?.pattern}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
      onBlur={onBlur}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
