'use client';

import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpNarrowWide,
} from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@synapcity/frontend-ui/core/tooltip';

import type { CollectionSort, CollectionSortField } from '../../types';

const SORT_OPTIONS: { value: CollectionSortField; label: string }[] = [
  { value: 'used', label: 'Last used' },
  { value: 'updated', label: 'Last updated' },
  { value: 'created', label: 'Created' },
  { value: 'title', label: 'Title A–Z' },
];

type SortOptionsMenuProps = {
  sort: CollectionSort;
  onSortChange: (sort: CollectionSort) => void;
};

export function SortOptionsMenu({ sort, onSortChange }: SortOptionsMenuProps) {
  const ascending = sort.direction === 'asc';
  const directionLabel = ascending ? 'Ascending' : 'Descending';

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" />}>
          <ArrowUpDown data-icon="inline-start" aria-hidden="true" />
          <span className="sr-only">Sort by: </span>
          {SORT_OPTIONS.find((option) => option.value === sort.field)?.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={sort.field}
              onValueChange={(value) =>
                onSortChange({ ...sort, field: value as CollectionSortField })
              }
            >
              {SORT_OPTIONS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label={`Sort direction: ${directionLabel}`}
              onClick={() =>
                onSortChange({ ...sort, direction: ascending ? 'desc' : 'asc' })
              }
            />
          }
        >
          {ascending ? (
            <ArrowUpNarrowWide aria-hidden="true" />
          ) : (
            <ArrowDownWideNarrow aria-hidden="true" />
          )}
        </TooltipTrigger>
        <TooltipContent>{directionLabel}</TooltipContent>
      </Tooltip>
    </div>
  );
}
