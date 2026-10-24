'use client';

import type { Ref } from 'react';
import { PasswordInput } from '@synapcity/frontend-ui/components/password-input';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Textarea } from '@synapcity/frontend-ui/core/textarea';

import type { FieldRendererProps } from '../../types';

/** Text, email, password and textarea fields. A non-string value shows as empty. */
export function TextRenderer({
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
    value: typeof value === 'string' ? value : '',
    onBlur,
    disabled,
    'aria-invalid': invalid || undefined,
    'aria-required': required || undefined,
    'aria-describedby': describedBy,
  };

  if (field.type === 'textarea') {
    return (
      <Textarea
        {...shared}
        ref={focusRef as Ref<HTMLTextAreaElement>}
        placeholder={field.props?.placeholder}
        maxLength={field.props?.maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === 'password') {
    return (
      <PasswordInput
        {...shared}
        ref={focusRef as Ref<HTMLInputElement>}
        autoComplete={field.props.autoComplete}
        placeholder={field.props.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === 'text' || field.type === 'email') {
    return (
      <Input
        {...shared}
        ref={focusRef as Ref<HTMLInputElement>}
        type={field.type}
        autoComplete={field.props?.autoComplete}
        placeholder={field.props?.placeholder}
        maxLength={field.props?.maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  throw new Error(`TextRenderer cannot render a field of type "${field.type}"`);
}
