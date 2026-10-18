'use client';

import { Button } from '@synapcity/frontend-ui/core/button';

import type { CollectionFilters } from '../../shared';

type CollectionTagChipsProps = {
  /** Every tag in use, most used first. Only the first `limit` get a chip. */
  tags: string[];
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  /** How many chips to show; the rest stay in the filter menu. */
  limit?: number;
};

/** A short row of the most used tags, each a toggle for the tag filter. */
export function CollectionTagChips({
  tags,
  filters,
  onFiltersChange,
  limit = 8,
}: CollectionTagChipsProps) {
  const shown = tags.slice(0, limit);
  if (shown.length === 0) return null;

  function toggle(tag: string) {
    onFiltersChange({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter((value) => value !== tag)
        : [...filters.tags, tag],
    });
  }

  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex flex-wrap items-center gap-2"
    >
      {shown.map((tag) => (
        <Button
          key={tag}
          variant={filters.tags.includes(tag) ? 'secondary' : 'outline'}
          size="xs"
          aria-pressed={filters.tags.includes(tag)}
          onClick={() => toggle(tag)}
        >
          {tag}
        </Button>
      ))}
      {tags.length > limit && (
        <span className="text-xs text-muted-foreground">
          +{tags.length - limit} more in Filter
        </span>
      )}
    </div>
  );
}
