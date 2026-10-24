import type { ReactNode } from 'react';

/** Gives a widget body a card-sized frame in stories. */
export function WidgetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-72 rounded-md border border-border bg-card p-4 text-card-foreground">
      {children}
    </div>
  );
}
