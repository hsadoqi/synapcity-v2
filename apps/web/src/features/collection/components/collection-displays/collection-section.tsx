import type { LucideIcon } from 'lucide-react';

import { EmptyNote } from '@synapcity/frontend-ui/components/empty-note';
import { SectionHeading } from '@synapcity/frontend-ui/components/section-heading';

import { cn } from '@/lib/utils';

type CollectionSectionProps = {
  /** The heading's id; the section is labelled by it. Unique on the page. */
  id: string;
  heading: string;
  icon?: LucideIcon;
  /** Shown instead of the children when `isEmpty`. */
  emptyMessage: React.ReactNode;
  isEmpty: boolean;
  /** Closer spacing between the heading and the content. */
  tight?: boolean;
  children: React.ReactNode;
};

/** A headed section of a page showing some items, or a note when there are none. */
export function CollectionSection({
  id,
  heading,
  icon,
  emptyMessage,
  isEmpty,
  tight = false,
  children,
}: CollectionSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn('flex flex-col gap-3', tight && 'gap-2')}
    >
      <SectionHeading id={id} icon={icon}>
        {heading}
      </SectionHeading>
      {isEmpty ? <EmptyNote>{emptyMessage}</EmptyNote> : children}
    </section>
  );
}

/** The heading row of a section's skeleton: same heading, hidden from assistive tech. */
export function CollectionSectionSkeleton({
  heading,
  icon,
  tight = false,
  children,
}: Pick<CollectionSectionProps, 'heading' | 'icon' | 'tight' | 'children'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex flex-col gap-3', tight && 'gap-2')}
    >
      <SectionHeading icon={icon}>{heading}</SectionHeading>
      {children}
    </div>
  );
}
