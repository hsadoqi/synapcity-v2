'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@synapcity/frontend-ui/core/button';

import { signOut } from '@/features/auth/server/actions/actions';

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
export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  );
}
