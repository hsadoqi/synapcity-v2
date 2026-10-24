'use client';

// TODO: Can we make this more generic/reusable so it can be used for contexts/use cases beyond deleting account like deleting a space/document/dashboard/widget(future)?
import { useActionState, useId } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@synapcity/frontend-ui/core/button';

import {
  confirmAccountDeletion,
  type DeleteAccountState,
} from '@/app/auth/delete-account/actions';
import { FormMessage } from '@synapcity/frontend-forms';
import { AuthShell } from '@/features/auth/shared/auth-shell';

const initialState: DeleteAccountState = {};

/**
 * The final step of deleting an account. Opening the emailed link only brings
 * the person here; the deletion happens when this button is pressed, so a mail
 * scanner or a link preview that opens the link cannot delete anything.
 */
export function DeleteAccountCard({
  email,
  settingsHref,
}: {
  email: string | null;
  settingsHref: string;
}) {
  const [state, formAction, deleting] = useActionState(
    confirmAccountDeletion,
    initialState,
  );
  const messageId = useId();

  return (
    <AuthShell
      title="Delete your account"
      description={
        email
          ? `You confirmed ${email}. This is the last step, and it cannot be undone.`
          : 'This is the last step, and it cannot be undone.'
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Your account, profile and photo are deleted for good, and you are
          signed out everywhere.
        </p>
        <FormMessage id={messageId} state={{ error: state.error }} />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="destructive"
            size="lg"
            disabled={deleting}
            aria-busy={deleting}
          >
            {deleting ? 'Deleting…' : 'Permanently delete my account'}
          </Button>
          <Link
            href={settingsHref}
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Keep my account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
