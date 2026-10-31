'use client';

import { createContext, useCallback, useContext, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@synapcity/frontend-ui/core/card';

const FocusHeadingContext = createContext<() => void>(() => {});

/**
 * Moves focus to the heading of the AuthShell this is rendered in, so a state
 * change inside the card (a link sent) is announced from the top. Outside a
 * card it does nothing.
 */
export function useFocusAuthHeading() {
  return useContext(FocusHeadingContext);
}

interface AuthShellProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * The one card every auth page renders. `(auth)/layout.tsx` owns centring and
 * width; this owns the heading structure, so each page has exactly one h1.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  // The card owns its heading, so a second card on the page is never focused.
  const headingRef = useRef<HTMLDivElement>(null);
  const focusHeading = useCallback(() => headingRef.current?.focus(), []);
  return (
    <FocusHeadingContext.Provider value={focusHeading}>
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
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </CardHeader>
        {children ? (
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        ) : null}
        {footer ? (
          <CardFooter className="justify-center gap-2 border-t">
            {footer}
          </CardFooter>
        ) : null}
      </Card>
    </FocusHeadingContext.Provider>
  );
}
