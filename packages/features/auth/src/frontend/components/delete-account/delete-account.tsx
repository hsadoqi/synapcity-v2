'use client';

import { useActionState, useId } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@synapcity/frontend-ui/core/alert-dialog';

import type { AuthState, AuthAction } from '../../../contracts';
import {
  FormField,
  FormMessage,
  fieldErrorProps,
  useFocusFirstError,
} from '@synapcity/frontend-forms';
import { LINK_SIGN_IN_WINDOW_MINUTES } from '../../../contracts';
import { SignInAgain } from '../../next/components/sign-in-again';

const initialState: AuthState = {};

/**
 * Deleting the account, which cannot be undone. Three steps stand between a
 * click and a deletion, each for a different reason: this dialog (a slip of the
 * hand), typing the address (the right person is at the screen), and a link
 * emailed to that address (the person has the inbox, not just an open session).
 * The last step is a button on the page the link opens; nothing is deleted
 * here, and nothing is deleted by opening the link alone.
 */
export function DeleteAccount({
  email,
  requestAccountDeletion,
  signInHref,
}: {
  email: string | null;
  requestAccountDeletion: AuthAction;
  signInHref: (returnTo: string) => string;
}) {
  const [state, formAction, sending] = useActionState(
    requestAccountDeletion,
    initialState,
  );
  const formRef = useFocusFirstError(state);
  const messageId = useId();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Delete account</span>
          <span className="text-sm text-muted-foreground">
            {email
              ? 'Permanently delete your account and everything in it. This cannot be undone.'
              : 'This account has no email address, so we cannot send the link that confirms a deletion.'}
          </span>
        </div>
        {email ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button type="button" variant="destructive" size="sm" />}
            >
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your account, profile and photo are deleted for good, and you
                  are signed out everywhere. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {state.success ? (
                <>
                  <p role="status" className="text-sm font-medium">
                    {state.message}
                  </p>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
                </>
              ) : (
                <form
                  ref={formRef}
                  action={formAction}
                  noValidate
                  className="flex flex-col gap-4"
                >
                  <FormField
                    id="delete-account-email"
                    // The action reads `email`; the id stays unique on the page.
                    name="email"
                    {...fieldErrorProps(state, 'email', messageId)}
                    label="Type your email address to continue"
                    hint={`We will send a link to ${email}. Open it within ${LINK_SIGN_IN_WINDOW_MINUTES} minutes to finish.`}
                    type="email"
                    autoComplete="off"
                    defaultValue={state.data?.user?.email}
                    required
                  />
                  <FormMessage id={messageId} state={{ error: state.error }} />
                  {state.signedOut ? (
                    <SignInAgain signInHref={signInHref} />
                  ) : null}
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={sending}
                      aria-busy={sending}
                    >
                      {sending ? 'Sending…' : 'Send confirmation link'}
                    </Button>
                  </AlertDialogFooter>
                </form>
              )}
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>
    </div>
  );
}
