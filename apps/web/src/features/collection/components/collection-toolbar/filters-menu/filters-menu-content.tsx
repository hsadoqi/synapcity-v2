'use client';

import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@synapcity/frontend-ui/core/dropdown-menu';

import type { CollectionFilters, CollectionGrouping } from '../../../shared';
import { CollectionFilterMenu } from './collection-filter-menu';

type FiltersMenuContentProps = {
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  /** Adds a submenu to filter by group. Omit, or pass no options, to hide it. */
  grouping?: CollectionGrouping;
};

export function FiltersMenuContent({
  filters,
  onFiltersChange,
  grouping,
}: FiltersMenuContentProps) {
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
    </DropdownMenuContent>
  );
}
