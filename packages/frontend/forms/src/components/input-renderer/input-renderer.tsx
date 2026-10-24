'use client';

import type { Ref } from 'react';
import { PasswordInput } from '@synapcity/frontend-ui/components/password-input';
import { Input } from '@synapcity/frontend-ui/core/input';
import { Textarea } from '@synapcity/frontend-ui/core/textarea';

import type { FieldRendererProps, InputMode } from '../../types';

/** The keyboard each type asks for, and whether the browser may "fix" its text. */
const BY_TYPE = {
  text: { inputMode: undefined, literal: false },
  email: { inputMode: 'email', literal: true },
  url: { inputMode: 'url', literal: true },
  tel: { inputMode: 'tel', literal: false },
  search: { inputMode: 'search', literal: false },
  password: { inputMode: undefined, literal: true },
} as const satisfies Record<
  string,
  { inputMode: InputMode | undefined; literal: boolean }
>;

/**
 * Text, email, password, tel, url, search and textarea fields. A value that is
 * not a string shows as empty. Email, URL and password text is never
 * autocapitalised, autocorrected or spellchecked, because the browser would
 * change what the person typed.
 */
export function InputRenderer({
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
        minLength={field.props?.minLength}
        maxLength={field.props?.maxLength}
        autoComplete={field.props?.autoComplete}
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
        minLength={field.props.minLength}
        maxLength={field.props.maxLength}
        autoCapitalize="none"
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (
    field.type === 'text' ||
    field.type === 'email' ||
    field.type === 'tel' ||
    field.type === 'url' ||
    field.type === 'search'
  ) {
    const behaviour = BY_TYPE[field.type];
    return (
      <Input
        {...shared}
        ref={focusRef as Ref<HTMLInputElement>}
        type={field.type}
        inputMode={field.props?.inputMode ?? behaviour.inputMode}
        autoComplete={field.props?.autoComplete}
        autoCapitalize={behaviour.literal ? 'none' : undefined}
        spellCheck={behaviour.literal ? false : undefined}
        placeholder={field.props?.placeholder}
        minLength={field.props?.minLength}
        maxLength={field.props?.maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  throw new Error(
    `InputRenderer cannot render a field of type "${field.type}"`,
  );
}
