'use client';

import { useEffect } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import { MESSAGE_HEADING_ID, MessagePage } from '@synapcity/frontend-shells';
import { reportCaughtError } from '@synapcity/frontend-error-reports';

/**
 * When the documents page fails to load. Sits inside the home layout, so the
 * shell and its navigation stay; the root boundary would replace them.
 */
export default function DocumentsError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error('Documents failed to load', { digest: error.digest });
    reportCaughtError(error);
    document.getElementById(MESSAGE_HEADING_ID)?.focus();
  }, [error]);

  return (
    <MessagePage
      title="Your documents didn't load"
      description="Nothing in them has changed. Try again; if it keeps failing, wait a few minutes first."
    >
      <Button type="button" size="lg" onClick={() => retry()}>
        Try again
      </Button>
    </MessagePage>
  );
}
