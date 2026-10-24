import type { ReactNode } from 'react';

/** Shown when a widget's source record no longer exists. */
export function WidgetUnavailable({ kind }: { kind: string }) {
  return (
    <p role="status" className="m-0 text-sm text-muted-foreground">
      This {kind} is no longer available.
    </p>
  );
}

/** Shown when a widget has nothing to list yet. */
export function WidgetEmpty({ children }: { children: ReactNode }) {
  return <p className="m-0 text-sm text-muted-foreground">{children}</p>;
}
