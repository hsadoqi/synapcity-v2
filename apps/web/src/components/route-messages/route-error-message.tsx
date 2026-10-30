'use client';

import { useEffect } from 'react';
import { reportCaughtError } from '@synapcity/frontend-error-reports';
import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

import { MESSAGE_HEADING_ID, MessagePage } from '@synapcity/frontend-shells';

/**
 * What a route shows when something unexpected throws while it renders or runs
 * an action. Expected problems (a wrong password, a refused name) never get
 * here: they come back as values and show beside the field.
 *
 * It carries no shell. An error boundary replaces the layouts below it, so the
 * root boundary wraps this in the public shell, while the `(protected)`
 * boundary sits inside the workspace shell and keeps it on screen.
 */
export function RouteErrorMessage({
  error,
  retry,
  variant = 'unexpected',
}: {
  /** The thrown error. An `unavailable` page has none: nothing threw. */
  error?: Error & { digest?: string };
  retry: () => void;
  /**
   * `unavailable` is the Auth service being unreachable, not a bug: the proxy
   * answers a protected page with it instead of a sign-in redirect, so
   * it is not logged or reported as an unexpected error.
   */
  variant?: 'unexpected' | 'unavailable';
}) {
  useEffect(() => {
    if (variant === 'unexpected' && error) {
      // The digest matches the server log entry; the message can hold details
      // that must not be repeated here.
      console.error('Unexpected error', { digest: error.digest });
      // Sent only if the person turned error reports on; scrubbed first.
      reportCaughtError(error);
    }
    document.getElementById(MESSAGE_HEADING_ID)?.focus();
  }, [error, variant]);

  const unavailable = variant === 'unavailable';
  return (
    <MessagePage
      title={
        unavailable
          ? "We can't reach the sign-in service"
          : 'Something went wrong'
      }
      description={
        unavailable
          ? "You are not signed out. The service that checks your session isn't answering right now. Try again in a moment."
          : 'An unexpected problem stopped this page. Try again. If it keeps happening, wait a few minutes first.'
      }
    >
      <Button type="button" size="lg" onClick={() => retry()}>
        Try again
      </Button>
      <LinkButton href="/" variant="outline" size="lg">
        Go to the home page
      </LinkButton>
    </MessagePage>
  );
}
