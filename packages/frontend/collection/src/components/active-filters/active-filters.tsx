'use client';

import { X } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';

import { EMPTY_FILTERS, hasActiveFilters } from '../../utils';
import type { CollectionFilters } from '../../types';

type ActiveFiltersProps = {
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
};

export function ActiveFilters({
  filters,
  onFiltersChange,
}: ActiveFiltersProps) {
  if (!hasActiveFilters(filters)) return null;

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.pinned
      ? [
          {
            key: 'pinned',
            label: 'Pinned',
            remove: () => onFiltersChange({ ...filters, pinned: false }),
          },
        ]
      : []),
    ...(filters.recent
      ? [
          {
            key: 'recent',
            label: 'Recently updated',
            remove: () => onFiltersChange({ ...filters, recent: false }),
          },
        ]
      : []),
    ...filters.groups.map((group) => ({
      key: `group-${group}`,
      label: group,
      remove: () =>
        onFiltersChange({
          ...filters,
          groups: filters.groups.filter((value) => value !== group),
        }),
    })),
    ...filters.tags.map((tag) => ({
      key: `tag-${tag}`,
      label: `Tag: ${tag}`,
      remove: () =>
        onFiltersChange({
          ...filters,
          tags: filters.tags.filter((value) => value !== tag),
        }),
    })),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
      role="group"
    >
      {chips.map((chip) => (
        <Button
          key={chip.key}
          variant="outline"
          size="xs"
          onClick={chip.remove}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <X data-icon="inline-end" aria-hidden="true" />
        </Button>
      ))}
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onFiltersChange(EMPTY_FILTERS)}
      >
        Clear
      </Button>
    </div>
  );
}
