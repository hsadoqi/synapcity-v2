'use client';

import type { ComponentProps } from 'react';
import { FormField, fieldErrorProps } from '@synapcity/frontend-forms';
import { MAX_NAME_LENGTH } from '@synapcity/domain-identity';
import { useProfileForm } from '../../../next/components/profile-form-shell';

type InputProps = Omit<ComponentProps<'input'>, 'id' | 'defaultValue'>;

/**
 * The first-name (required) and last-name (optional) inputs, for any form that
 * holds its own state: registration places them in its own form. `state` is
 * the form's last refusal, so the right input is marked; `firstNameProps` and
 * `lastNameProps` are spread last (for example React Hook Form's `register`).
 */
export function PersonNameInputs({
  state,
  messageId,
  defaultFirstName,
  defaultLastName,
  autoFocus,
  firstNameProps,
  lastNameProps,
}: {
  state: { error?: string; fields?: readonly string[] };
  messageId: string;
  defaultFirstName: string;
  defaultLastName: string;
  autoFocus?: boolean;
  firstNameProps?: InputProps;
  lastNameProps?: InputProps;
}) {
  return (
    <>
      <FormField
        id="firstName"
        {...fieldErrorProps(state, 'firstName', messageId)}
        label="First name"
        type="text"
        autoComplete="given-name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={defaultFirstName}
        autoFocus={autoFocus}
        required
        {...firstNameProps}
      />
      <FormField
        id="lastName"
        {...fieldErrorProps(state, 'lastName', messageId)}
        label="Last name"
        hint="Optional."
        type="text"
        autoComplete="family-name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={defaultLastName}
        {...lastNameProps}
      />
    </>
  );
}

/**
 * The same inputs inside a `ProfileFormShell`, reading its state. Saving a
 * valid first name completes profile setup.
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
    <PersonNameInputs
      state={state}
      messageId={messageId}
      defaultFirstName={state.firstName ?? defaultFirstName}
      defaultLastName={state.lastName ?? defaultLastName}
      autoFocus={autoFocus}
    />
  );
}
