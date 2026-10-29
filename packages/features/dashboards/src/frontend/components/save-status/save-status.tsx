'use client';

import { Button } from '@synapcity/frontend-ui/core/button';
import { cn } from '@synapcity/frontend-ui/lib/utils';
import { useDashboardConfig } from '../../config';
import { useDashboardStore, type SaveStatus } from '../../store';

const LABEL: Record<SaveStatus, string> = {
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Not saved',
  conflict: 'Changed elsewhere',
};

/**
 * Where the save stands, in the toolbar. A polite live region, so changes are
 * announced without moving focus. "Saved" shows only after the storage has
 * confirmed. A failed save offers Retry; a conflict offers Reload, which
 * discards the edits that were never saved (the text says so).
 */
export function SaveStatusIndicator() {
  const status = useDashboardStore((s) => s.saveStatus);
  const message = useDashboardStore((s) => s.saveMessage);
  const requestSave = useDashboardStore((s) => s.requestSave);
  const { onReload } = useDashboardConfig();
  const alarming = status === 'failed' || status === 'conflict';

  return (
    <div
      data-slot="save-status"
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
    >
      <p
        role="status"
        aria-live="polite"
        className={cn(
          'm-0 text-sm',
          alarming ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {LABEL[status]}
        {status === 'failed' && message ? `. ${message}` : null}
        {status === 'conflict'
          ? '. This dashboard was saved somewhere else. Reload to see it; edits you have not saved here are discarded.'
          : null}
      </p>
      {status === 'failed' && (
        <Button size="sm" variant="outline" onClick={requestSave}>
          Retry
        </Button>
      )}
      {status === 'conflict' && onReload && (
        <Button size="sm" variant="outline" onClick={onReload}>
          Reload
        </Button>
      )}
    </div>
  );
}
