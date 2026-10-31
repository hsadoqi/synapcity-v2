'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@synapcity/frontend-ui/core/button';
import type { AuthFormAction } from '../../../contracts';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

/** The only sign-out path: the server action clears the session and revalidates the layout. */
export function SignOutButton({ signOut }: { signOut: AuthFormAction }) {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}
