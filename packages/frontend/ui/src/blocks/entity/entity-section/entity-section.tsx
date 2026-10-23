import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@synapcity/frontend-ui/core/button';
import { LinkButton } from '@synapcity/frontend-ui/components/link-button';
import {
  EntityIcon,
  EntityItemCard,
} from '@synapcity/frontend-ui/blocks/entity';
import type { EntityItem } from '@synapcity/frontend-ui/types/entity';
interface EntitySectionProps {
  id: string;
  title: string;
  items: EntityItem[];
  total: number;
  /** Omit when the section already lists everything. */
  viewAllHref?: string;
  emptyTitle: string;
  emptyBody: string;
  emptyIcon: string;
  /** Labels the create link; shown only with `createHref`. */
  createLabel: string;
  /** Where creating one happens. Without it the empty state offers no button. */
  createHref?: string;
  prefix: string;
  /** How many items to show; defaults to 4. */
  limit?: number;
  /** What the count counts, for screen readers; defaults to item/items. */
  noun?: { one: string; other: string };
}

const pluralRules = new Intl.PluralRules('en-US');

export function EntitySection({
  id,
  title,
  items,
  total,
  viewAllHref,
  emptyTitle,
  emptyBody,
  emptyIcon,
  createLabel,
  createHref,
  prefix,
  limit = 4,
  noun = { one: 'item', other: 'items' },
}: EntitySectionProps) {
  const headingId = `${id}-heading`;
  const visible = items.slice(0, limit);
  const slug = `${prefix}/${id}`;
  const countNoun = pluralRules.select(total) === 'one' ? noun.one : noun.other;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          id={headingId}
          className="flex items-baseline gap-2 text-base font-medium text-foreground"
        >
          {title}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            <span className="sr-only">, </span>
            {total}
            <span className="sr-only"> {countNoun}</span>
          </span>
        </h2>
        {total > 0 && viewAllHref && (
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
              <EntityItemCard slug={slug} entity={item} />
            </li>
          ))}
        </ul>
      ) : (
        <EntitySectionEmpty
          title={emptyTitle}
          body={emptyBody}
          createLabel={createLabel}
          createHref={createHref}
          icon={emptyIcon}
        />
      )}
    </section>
  );
}

interface EntitySectionEmptyProps {
  title: string;
  body: string;
  createLabel: string;
  createHref?: string;
  icon: string;
}

function EntitySectionEmpty({
  icon,
  title,
  body,
  createLabel,
  createHref,
}: EntitySectionEmptyProps) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed border-border px-5 py-6 sm:flex-row sm:items-center">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <EntityIcon
          name={icon}
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground text-pretty">{body}</p>
      </div>
      {createHref && (
        <LinkButton href={createHref} variant="outline" size="sm">
          <Plus data-icon="inline-start" aria-hidden="true" />
          {createLabel}
        </LinkButton>
      )}
    </div>
  );
}
