'use client';

import { useEffect } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { useFocusAuthHeading } from '../auth-shell';

/**
 * What a form turns into once its request is accepted. Focus moves to the page
 * heading, which the confirmation retitles, so keyboard and screen-reader users
 * land on the new state instead of on a button that no longer exists.
 */
export function AuthConfirmation({
  message,
  email,
  onEdit,
  children,
}: {
  /** The action's own reply: its wording is chosen not to reveal accounts. */
  message?: string;
  email: string;
  /** Returns to the form with what was typed, for a mistyped address. */
  onEdit?: () => void;
  /** Follow-up actions, such as resending the link. */
  children?: React.ReactNode;
}) {
  const focusHeading = useFocusAuthHeading();
  useEffect(() => {
    focusHeading();
  }, [message, focusHeading]);

  return (
    <>
      <div role="status" className="flex flex-col gap-2">
        <p className="text-sm">{message}</p>
        {email ? (
          <p className="text-sm text-muted-foreground">
            Requested for {email}. If nothing arrives, check your spam folder.
          </p>
        ) : null}
      </div>
      {children}
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          onClick={onEdit}
        >
          Use a different email
        </Button>
      ) : null}
    </>
  );
}
