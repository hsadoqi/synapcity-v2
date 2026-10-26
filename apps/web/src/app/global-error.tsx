'use client';

import '../styles/globals.css';

import { useEffect } from 'react';
import { reportCaughtError } from '@synapcity/frontend-error-reports';
import { Button, buttonVariants } from '@synapcity/frontend-ui/core/button';
import { ModeProvider } from '@synapcity/frontend-preferences';

import { MESSAGE_HEADING_ID, MessagePage } from '@synapcity/frontend-shells';
import { fontVariables } from './fonts';

/**
 * The last resort: what shows when the root layout itself fails, which
 * `error.tsx` cannot catch. It replaces the whole document, so it brings what
 * the layout would have: the stylesheet, the font variables and the theme
 * provider (same settings as the root providers, so light and dark follow the
 * person's choice). It uses only CSS-driven pieces, nothing that needs the
 * router, the user or the Supabase client, because whatever failed may be any
 * of those.
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
    // Sent only if the person turned error reports on; scrubbed first.
    reportCaughtError(error);
    document.getElementById(MESSAGE_HEADING_ID)?.focus();
  }, [error]);

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <title>Something went wrong</title>
      </head>
      <body>
        <ModeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-svh px-4 py-8">
            <MessagePage
              title="Something went wrong"
              description="An unexpected problem stopped the app from loading. Try again. If it keeps happening, wait a few minutes first."
            >
              <Button type="button" size="lg" onClick={() => retry()}>
                Try again
              </Button>
              {/* A full page load on purpose: the root layout failed, so the
                  router and any state that caused it are not to be trusted.
                  `next/link` would depend on exactly that. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/"
                className={buttonVariants({ variant: 'outline', size: 'lg' })}
              >
                Go to the home page
              </a>
            </MessagePage>
          </main>
        </ModeProvider>
      </body>
    </html>
  );
}
