'use client';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@synapcity/frontend-ui/core/dropdown-menu';

import type { CollectionFilters, CollectionGrouping } from '../../types';
import { CollectionFilterMenu } from '../collection-filter-menu';

type FiltersMenuContentProps = {
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  /** Adds a submenu to filter by group. Omit, or pass no options, to hide it. */
  grouping?: CollectionGrouping;
  /** Adds a submenu to filter by tag. Omit, or pass none, to hide it. */
  tags?: string[];
};

export function FiltersMenuContent({
  filters,
  onFiltersChange,
  grouping,
  tags,
}: FiltersMenuContentProps) {
  function toggleTag(tag: string, checked: boolean) {
    onFiltersChange({
      ...filters,
      tags: checked
        ? [...filters.tags, tag]
        : filters.tags.filter((value) => value !== tag),
    });
  }

  function toggleGroup(group: string, checked: boolean) {
    onFiltersChange({
      ...filters,
      groups: checked
        ? [...filters.groups, group]
        : filters.groups.filter((value) => value !== group),
    });
  }

  return (
    <DropdownMenuContent align="start" className="w-48">
      <DropdownMenuGroup>
        <DropdownMenuLabel>Show only</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={filters.pinned}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, pinned: checked })
          }
        >
          Pinned
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.recent}
          onCheckedChange={(checked) =>
            onFiltersChange({ ...filters, recent: checked })
          }
        >
          Recently updated
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      {grouping && grouping.options.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <CollectionFilterMenu
            label={grouping.label}
            items={grouping.options}
            selected={filters.groups}
            onToggle={toggleGroup}
          />
        </>
      )}

      {tags && tags.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <CollectionFilterMenu
            label="More tags"
            items={tags}
            selected={filters.tags}
            onToggle={toggleTag}
          />
        </>
      )}
    </DropdownMenuContent>
  );
}
