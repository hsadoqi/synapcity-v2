'use client';

import { useSyncExternalStore } from 'react';
import { formatWrittenDate } from '@synapcity/domain-preferences';
import { useDateTimeFormatting } from '@synapcity/frontend-preferences';

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
 * A written date the server and the viewer agree on ("Oct 2, 2025", in the
 * person's zone and date order), replaced once the page is running by words
 * ("Yesterday"). Rendering the relative words on the server would use the server's clock and
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
  const formatting = useDateTimeFormatting();
  const label = inBrowser
    ? formatEntityDate(at, formatting)
    : formatWrittenDate(new Date(at), formatting, {
        weekday: false,
        year: true,
      });

  return (
    <Tag className={className}>
      {srPrefix && <span className="sr-only">{srPrefix} </span>}
      <time dateTime={at}>{label}</time>
    </Tag>
  );
}
