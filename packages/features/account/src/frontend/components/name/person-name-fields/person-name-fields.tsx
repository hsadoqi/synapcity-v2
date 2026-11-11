'use client';

import { FormField, fieldErrorProps } from '@synapcity/frontend-forms';
import { MAX_NAME_LENGTH } from '@synapcity/domain-identity';
import { useProfileForm } from '../../../next/components/profile-form-shell';

/**
 * The first-name (required) and last-name (optional) inputs. Place them inside
 * a `ProfileFormShell`. Saving a valid first name completes profile setup.
 */
export function PersonNameFields({
  defaultFirstName,
  defaultLastName,
  autoFocus,
}: {
  defaultFirstName: string;
  defaultLastName: string;
  autoFocus?: boolean;
}) {
  const { state, messageId } = useProfileForm();

  return (
    <>
      <FormField
        id="firstName"
        {...fieldErrorProps(state, 'firstName', messageId)}
        label="First name"
        type="text"
        autoComplete="given-name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.firstName ?? defaultFirstName}
        autoFocus={autoFocus}
        required
      />
      <FormField
        id="lastName"
        {...fieldErrorProps(state, 'lastName', messageId)}
        label="Last name"
        hint="Optional."
        type="text"
        autoComplete="family-name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.lastName ?? defaultLastName}
      />
    </>
  );
}
