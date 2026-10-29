'use client';

import { formatWrittenDate } from '@synapcity/domain-preferences';
import { useDateTimeFormatting } from '@synapcity/frontend-preferences';
import { Badge } from '@synapcity/frontend-ui/core/badge';

/** One term and its value; the terms share a width so the values line up. */
const ROW = 'flex items-baseline gap-4';
const TERM = 'w-16 shrink-0 text-muted-foreground';

/**
 * A document's facts below its description: when it was last changed (only
 * when that differs from when it was made, so a document never edited does
 * not claim an edit), when it was made, and its tags. Pinned and last-viewed
 * state are the reader's own view, not the document's, and are left out.
 *
 * The list is named by a visually hidden heading: a `dl` has no ARIA role, so
 * a label on it is not reliably announced.
 */
export function DocumentDetails({
  createdAt,
  updatedAt,
  tags,
}: {
  createdAt: string;
  updatedAt: string;
  tags: readonly string[];
}) {
  const formatting = useDateTimeFormatting();
  const written = (iso: string) =>
    formatWrittenDate(new Date(iso), formatting, {
      weekday: false,
      year: true,
    });
  const edited = updatedAt !== createdAt;

  return (
    <div>
      <h2 className="sr-only">Document details</h2>
      <dl className="flex flex-col gap-2 text-sm">
        {edited && (
          <div className={ROW}>
            <dt className={TERM}>Updated</dt>
            <dd>
              <time dateTime={updatedAt}>{written(updatedAt)}</time>
            </dd>
          </div>
        )}
        <div className={ROW}>
          <dt className={TERM}>Created</dt>
          <dd>
            <time dateTime={createdAt}>{written(createdAt)}</time>
          </dd>
        </div>
        {tags.length > 0 && (
          <div className={ROW}>
            <dt className={TERM}>Tags</dt>
            <dd className="min-w-0">
              <ul
                role="list"
                aria-label="Tags"
                className="flex flex-wrap gap-1"
              >
                {tags.map((tag) => (
                  <li key={tag} className="max-w-full">
                    <Badge variant="secondary" className="max-w-full">
                      {tag}
                    </Badge>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
