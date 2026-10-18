'use client';

import { SearchX } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';

type CollectionNoResultsProps = {
  singular: string;
  query: string;
  hasFilters: boolean;
  onClearQuery: () => void;
  onClearFilters: () => void;
};

export function CollectionNoResults({
  singular,
  query,
  hasFilters,
  onClearQuery,
  onClearFilters,
}: CollectionNoResultsProps) {
  const trimmed = query.trim();

  return (
    <Empty className="border border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {trimmed
            ? `Nothing matches “${trimmed}”`
            : 'Nothing matches these filters'}
        </EmptyTitle>
        <EmptyDescription>
          {trimmed
            ? `No ${singular}s turned up for that search. Try a softer word, or check the spelling.`
            : `No ${singular}s fit every filter at once. Loosening one usually helps.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        {trimmed && (
          <Button variant="outline" onClick={onClearQuery}>
            Clear search
          </Button>
        )}
        {hasFilters && (
          <Button variant="ghost" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
