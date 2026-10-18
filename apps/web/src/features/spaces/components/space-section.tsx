'use client';

import { ArrowRight, Plus } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import { ItemCard } from './item-card';
import { DashboardItem, DocumentItem } from '../shared/types/types';
import { SpaceIcon } from './space-icon';
import Link from 'next/link';

interface SpaceSectionProps {
  id: string;
  title: string;
  items: (DocumentItem | DashboardItem)[];
  total: number;
  viewAllHref: string;
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: string;
  createLabel: string;
  prefix: string;
}

export function SpaceSection({
  id,
  title,
  items,
  total,
  viewAllHref,
  emptyTitle,
  emptyBody,
  emptyIcon,
  createLabel,
  prefix,
}: SpaceSectionProps) {
  const headingId = `${id}-heading`;
  const visible = items.slice(0, 4);
  const slug = `${prefix}/${id}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="flex items-baseline gap-2 text-base font-medium"
        >
          {title}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            <span className="sr-only">(</span>
            {total}
            <span className="sr-only"> items)</span>
          </span>
        </h2>
        {total > 0 && (
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href={viewAllHref} />}
          >
            View all
            <span className="sr-only"> {title.toLowerCase()}</span>
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        )}
      </div>

      {visible.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((item) => (
            <li key={item.id}>
              <ItemCard slug={slug} item={item} />
            </li>
          ))}
        </ul>
      ) : (
        <SectionEmpty
          slug={slug}
          title={emptyTitle}
          body={emptyBody}
          createLabel={createLabel}
          icon={emptyIcon}
        />
      )}
    </section>
  );
}

interface SectionEmptyProps {
  slug: string;
  title: string;
  body: string;
  createLabel: string;
  icon: string;
}

function SectionEmpty({ icon, title, body, createLabel }: SectionEmptyProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-md border border-dashed border-border px-5 py-6 sm:flex-row sm:items-center">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <SpaceIcon
          name={icon}
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground text-pretty">{body}</p>
      </div>
      <Button variant="outline" size="sm">
        <Plus data-icon="inline-start" aria-hidden="true" />
        {createLabel}
      </Button>
    </div>
  );
}
