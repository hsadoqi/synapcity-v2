'use client';

import { useActionState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { updateProfile } from '@/features/account/server/actions';
import type { ProfileState } from '@/features/account/shared/form-state';
import { MAX_NAME_LENGTH } from '@/features/account/shared/name';
import { AuthField } from '@/components/forms/form-field';
import { useFocusFirstError } from '@/components/forms/use-focus-first-error';
import { FormMessage } from '@/components/forms/form-message';

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
