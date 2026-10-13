'use client';

import { useEffect } from 'react';

import { AUTH_HEADING_ID } from './auth-shell';

/**
 * What a form turns into once its request is accepted. Focus moves to the page
 * heading, which the confirmation retitles, so keyboard and screen-reader users
 * land on the new state instead of on a button that no longer exists.
 */
export function AuthConfirmation({
  message,
  email,
  children,
}: {
  /** The action's own reply: its wording is chosen not to reveal accounts. */
  message?: string;
  email: string;
  /** Follow-up actions, such as resending the link. */
  children?: React.ReactNode;
}) {
  useEffect(() => {
    document.getElementById(AUTH_HEADING_ID)?.focus();
  }, [message]);

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
    </>
  );
}
