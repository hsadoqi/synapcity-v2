'use client';

import { ListFilter } from 'lucide-react';

import { Badge } from '@synapcity/frontend-ui/core/badge';
import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

import {
  countActiveFilters,
  type CollectionFilters,
  type CollectionGrouping,
} from '../../../shared';
import { FiltersMenuContent } from './filters-menu-content';

type FiltersMenuProps = {
  filters: CollectionFilters;
  onFiltersChange: (filters: CollectionFilters) => void;
  /** Adds a submenu to filter by group. Omit, or pass no options, to hide it. */
  grouping?: CollectionGrouping;
  /** Adds a submenu to filter by tag. Omit, or pass none, to hide it. */
  tags?: string[];
};

export function FiltersMenu({
  filters,
  onFiltersChange,
  grouping,
  tags,
}: FiltersMenuProps) {
  const activeFilterCount = countActiveFilters(filters);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <ListFilter data-icon="inline-start" aria-hidden="true" />
        Filter
        {activeFilterCount > 0 && (
          <Badge variant="secondary">
            <span className="sr-only">Active filters: </span>
            {activeFilterCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <FiltersMenuContent
        filters={filters}
        onFiltersChange={onFiltersChange}
        grouping={grouping}
        tags={tags}
      />
    </DropdownMenu>
  );
}
