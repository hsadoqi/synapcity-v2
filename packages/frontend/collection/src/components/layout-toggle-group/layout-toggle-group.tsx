'use client';

import { LayoutGrid, List } from 'lucide-react';

import {
  ToggleGroup,
  ToggleGroupItem,
} from '@synapcity/frontend-ui/core/toggle-group';

import type { CollectionLayout } from '../../types';

type LayoutToggleGroupProps = {
  layout: CollectionLayout;
  onLayoutChange: (layout: CollectionLayout) => void;
};

export function LayoutToggleGroup({
  layout,
  onLayoutChange,
}: LayoutToggleGroupProps) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[layout]}
      onValueChange={(value) => {
        // A single-select toggle group reports [] when the active item is
        // clicked again; ignore that so one layout is always selected.
        const next = value[0] as CollectionLayout | undefined;
        if (next) onLayoutChange(next);
      }}
      aria-label="Layout"
    >
      <ToggleGroupItem value="grid" aria-label="Grid view">
        <LayoutGrid aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view">
        <List aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
