'use client';

import { FormField } from '@/components/forms/form-field';
import { fieldErrorProps } from '@/components/forms/form-feedback';
import { MAX_NAME_LENGTH } from '@/features/account/types';
import { useProfileForm } from '../../profile';

/** The display-name input. Place it inside a `ProfileFormShell`. */
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
      label="Name"
      hint={`Up to ${MAX_NAME_LENGTH} characters.`}
      type="text"
      autoComplete="name"
      maxLength={MAX_NAME_LENGTH}
      defaultValue={state.name ?? defaultName}
      autoFocus={autoFocus}
      required
    />
  );
}
