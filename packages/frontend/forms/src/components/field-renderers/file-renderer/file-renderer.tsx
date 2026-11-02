'use client';

import { useEffect, type Ref } from 'react';
import { Input } from '@synapcity/frontend-ui/core/input';

import type { FieldRendererProps } from '../../../types';

/**
 * A file chooser. A file input cannot be controlled, so the chosen files stay
 * in the input and the form is told about them; when the form's value goes
 * back to nothing (a reset, or `afterSubmit: 'clear'`) the input is emptied
 * too. One file is a `File`, several are a list; nothing chosen is `undefined`
 * (or an empty list for a multiple field).
 */
export function FileRenderer({
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
  const props = field.type === 'file' ? field.props : undefined;
  const multiple = props?.multiple === true;
  const empty =
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.length === 0);

  // The id is unique to this field in this form, so the input can be found
  // without taking over the ref the form passes in for focus.
  useEffect(() => {
    if (!empty) return;
    const input = document.getElementById(id);
    if (
      input instanceof HTMLInputElement &&
      input.files &&
      input.files.length > 0
    ) {
      input.value = '';
    }
  }, [empty, id]);

  return (
    <Input
      ref={focusRef as Ref<HTMLInputElement>}
      id={id}
      name={field.name}
      type="file"
      accept={props?.accept}
      multiple={multiple}
      onChange={(event) => {
        const files = Array.from(event.target.files ?? []);
        if (multiple) onChange(files);
        else onChange(files[0]);
      }}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      aria-describedby={describedBy}
    />
  );
}
