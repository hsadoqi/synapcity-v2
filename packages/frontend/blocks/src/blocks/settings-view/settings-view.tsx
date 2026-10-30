'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { ScrollArea } from '@synapcity/frontend-ui/core/scroll-area';
import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface SettingsViewProps {
  title: string;
  description?: string;
  /** Settings body. Without it, placeholder rows show the scrolling layout. */
  children?: ReactNode;
  /** Leaves the view; the host puts its content back. */
  onDone: () => void;
  /** @default 'Done' */
  doneLabel?: string;
}

/**
 * Settings shown in place of a host's content, for hosts too small for a
 * dialog. Any host can use it: it knows nothing about what it replaces. Focus moves to its heading when it opens, so a keyboard or screen
 * reader user lands in it, and goes back to whatever opened it when it closes.
 */
export function SettingsView({
  title,
  description,
  children,
  onDone,
  doneLabel = 'Done',
}: SettingsViewProps) {
  const headingId = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const opener = document.activeElement;
    heading.current?.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  return (
    <section
      aria-labelledby={headingId}
      data-slot="settings-view"
      className="flex min-h-0 flex-1 flex-col gap-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3
            id={headingId}
            ref={heading}
            tabIndex={-1}
            className="text-sm font-medium outline-none"
          >
            {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onDone}>
          {doneLabel}
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 pr-3 text-sm text-muted-foreground">
          {children ??
            Array.from({ length: 24 }, (_, i) => (
              <p key={i}>Settings content goes here.</p>
            ))}
        </div>
      </ScrollArea>
    </section>
  );
}
