'use client';

import { useSyncExternalStore } from 'react';

import { formatEntityDate } from '../../utils';

interface EntityDateProps {
  /** ISO timestamp. */
  at: string;
  /** Read by screen readers before the date, such as "Updated". */
  srPrefix?: string;
  className?: string;
  /** `span` lets the date sit inside a sentence; the default is a paragraph. */
  as?: 'p' | 'span';
}

const subscribe = () => () => {};

/**
 * A plain date the server and the viewer agree on ("Oct 2", in UTC), replaced
 * once the page is running by words in the viewer's own time zone ("Yesterday").
 * Rendering the relative words on the server would use the server's clock and
 * zone, and hydration would keep them.
 */
export function EntityDate({
  at,
  srPrefix,
  className,
  as: Tag = 'p',
}: EntityDateProps) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const label = inBrowser ? formatEntityDate(at) : formatUtcDate(at);

  return (
    <Tag className={className}>
      {srPrefix && <span className="sr-only">{srPrefix} </span>}
      <time dateTime={at}>{label}</time>
    </Tag>
  );
}

function formatUtcDate(at: string) {
  return new Date(at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
