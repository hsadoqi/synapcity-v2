'use client';

import { FormField, fieldErrorProps } from '@synapcity/frontend-forms';
import { MAX_NAME_LENGTH } from '@synapcity/domain-identity';
import { useProfileForm } from '../../../next/components/profile-form-shell';

/**
 * The optional display-name input. Left blank, the person is shown by their
 * first name. Place it inside a `ProfileFormShell`.
 */
export function NameField({
  defaultName,
  autoFocus,
}: {
  defaultName: string;
  autoFocus?: boolean;
}) {
  const { state, messageId } = useProfileForm();

  return (
    <FormField
      id="name"
      {...fieldErrorProps(state, 'name', messageId)}
      label="Display name"
      hint={`Optional. Shown instead of your first name. Up to ${MAX_NAME_LENGTH} characters.`}
      type="text"
      autoComplete="nickname"
      maxLength={MAX_NAME_LENGTH}
      defaultValue={state.name ?? defaultName}
      autoFocus={autoFocus}
    />
  );
}
