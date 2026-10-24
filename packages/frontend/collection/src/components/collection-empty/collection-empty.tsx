'use client';

import { Plus, type LucideIcon } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@synapcity/frontend-ui/core/empty';

import type { CollectionEmptyCopy } from '../../types';

type CollectionEmptyProps = {
  icon: LucideIcon;
  singular: string;
  copy: CollectionEmptyCopy;
  /** Without it the empty state offers no button. */
  onCreate?: () => void;
};

export function CollectionEmpty({
  icon: Icon,
  singular,
  copy,
  onCreate,
}: CollectionEmptyProps) {
  return (
    <Empty className="border border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{copy.title}</EmptyTitle>
        <EmptyDescription>{copy.description}</EmptyDescription>
      </EmptyHeader>
      {onCreate && (
        <EmptyContent>
          <Button onClick={onCreate}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            New {singular}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
