import { Button } from '@synapcity/frontend-ui/core/button';
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

/**
 * Shown when the host could not read the records a widget lists. Distinct from
 * an empty list: "nothing pinned" and "could not load" must never look alike.
 * Retry appears only when the host can re-read (`onRetry`).
 */
export function WidgetFailed({
  children = "Couldn't load these items.",
  onRetry,
}: {
  children?: ReactNode;
  onRetry?: (() => void) | null;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <p role="status" className="m-0 text-sm text-muted-foreground">
        {children}
      </p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
