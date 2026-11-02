'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@synapcity/frontend-ui/lib/utils';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  /** 4 for a group inside an accordion section, whose trigger is already the h3. */
  level?: 3 | 4;
};

/**
 * A titled group of rows inside a settings tab. The tab title is the h2, so the
 * section is an h3: set in the heading face and heavier than the row labels,
 * so the groups read before the rows inside them.
 */
export function SettingsSection({
  title,
  children,
  level = 3,
}: SettingsSectionProps) {
  const headingId = useId();
  const Heading = level === 3 ? 'h3' : 'h4';
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <Heading
        id={headingId}
        className={cn(
          'font-heading font-semibold',
          level === 3 ? 'text-base' : 'text-sm',
        )}
      >
        {title}
      </Heading>
      {children}
    </section>
  );
}
