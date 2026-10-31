'use client';

import { useEffect, useRef } from 'react';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';

/**
 * A page that is just a message and a way out: an unexpected error, a page that
 * does not exist. It is laid out like the auth pages (one centred card) so the
 * app's failure states look like the rest of it.
 */
export function MessagePage({
  title,
  description,
  focusKey,
  children,
}: {
  title: string;
  description: string;
  /**
   * Given, the heading takes focus when the page appears and again whenever
   * this changes, such as a new error. A page that appears after a failure
   * passes it; one reached by navigation leaves it out.
   */
  focusKey?: unknown;
  /** The ways forward, such as a retry button or a link home. */
  children: React.ReactNode;
}) {
  // This page's own heading, so another message on the page is never focused.
  const headingRef = useRef<HTMLDivElement>(null);
  const takesFocus = focusKey !== undefined;
  useEffect(() => {
    if (takesFocus) headingRef.current?.focus();
  }, [takesFocus, focusKey]);

  return (
    <div className="flex flex-1 items-start justify-center sm:items-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Card size="lg">
          <CardHeader className="gap-2">
            <CardTitle
              as="h1"
              size="lg"
              ref={headingRef}
              tabIndex={-1}
              className="outline-none"
            >
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardFooter className="gap-2 border-t">{children}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
