'use client';

import { useEffect } from 'react';

/**
 * The last resort: what shows when the root layout itself fails, which
 * `error.tsx` cannot catch. It replaces the whole document, so none of the
 * app's styles, fonts, components or providers exist here. It is plain
 * semantic HTML on purpose, and `color-scheme` lets the browser pick readable
 * light or dark defaults. Anything the app can still render is handled by
 * `error.tsx`, which keeps the real design.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // The digest matches the server log entry; the message can hold details
    // that must not be repeated here.
    console.error('Unexpected error', { digest: error.digest });
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light dark" />
        <title>Something went wrong</title>
      </head>
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>
            An unexpected problem stopped the app from loading. Try again. If it
            keeps happening, wait a few minutes first.
          </p>
          <p>
            <button type="button" onClick={() => retry()}>
              Try again
            </button>{' '}
            {/* A full page load on purpose: the root layout failed, so the
                router and any state that caused it are not to be trusted.
                `next/link` would depend on exactly that. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">Go to the home page</a>
          </p>
        </main>
      </body>
    </html>
  );
}
