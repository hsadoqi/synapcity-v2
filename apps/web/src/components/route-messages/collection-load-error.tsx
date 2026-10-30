'use client';

import { useEffect } from 'react';
import { reportCaughtError } from '@synapcity/frontend-error-reports';
import { Button } from '@synapcity/frontend-ui/core/button';

import { MESSAGE_HEADING_ID, MessagePage } from '@synapcity/frontend-shells';

/**
 * What a collection page shows when it fails to load: the same words for every
 * collection, naming the one that failed. It carries no shell; the page sits
 * inside the home layout, so the shell and its navigation stay, where the root
 * boundary would replace them.
 */
export function CollectionLoadError({
  collection,
  error,
  retry,
}: {
  /** The collection's plural name in lower case, such as "dashboards". */
  collection: string;
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    const name = collection.charAt(0).toUpperCase() + collection.slice(1);
    // The digest matches the server log entry; the message can hold details
    // that must not be repeated here.
    console.error(`${name} failed to load`, { digest: error.digest });
    reportCaughtError(error);
    document.getElementById(MESSAGE_HEADING_ID)?.focus();
  }, [collection, error]);

  return (
    <MessagePage
      title={`Your ${collection} didn't load`}
      description="Nothing in them has changed. Try again; if it keeps failing, wait a few minutes first."
    >
      <Button type="button" size="lg" onClick={() => retry()}>
        Try again
      </Button>
    </MessagePage>
  );
}
