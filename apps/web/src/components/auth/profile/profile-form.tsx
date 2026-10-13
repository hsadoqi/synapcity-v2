'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import {
  updateProfile,
  type ProfileState,
} from '@/app/[userId]/settings/actions';
import { MAX_NAME_LENGTH } from '@/lib/auth/name/name';
import { AuthField } from '../form/auth-field';
import { useFocusFirstError } from '../form/use-focus-first-error';
import { FormMessage } from '../form/form-message';

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, {
    name: defaultName,
  } satisfies ProfileState);

  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <AuthField
        id="name"
        label="Name"
        type="text"
        autoComplete="name"
        maxLength={MAX_NAME_LENGTH}
        defaultValue={state.name ?? defaultName}
        required
      />
      <FormMessage state={state} />
      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
