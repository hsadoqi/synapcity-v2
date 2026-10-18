'use client';

import { Plus } from 'lucide-react';

import { Button } from '@synapcity/frontend-ui/core/button';

type CreateButtonProps = {
  onCreate: () => void;
  singular: string;
  /** Layout only (position, margin, order) — set by the parent. */
  className?: string;
};

export function CreateButton({
  onCreate,
  singular,
  className,
}: CreateButtonProps) {
  return (
    <Button
      onClick={onCreate}
      aria-label={`New ${singular}`}
      className={className}
    >
      <Plus data-icon="inline-start" aria-hidden="true" />
      <span className="sm:hidden">New</span>
      <span className="hidden sm:inline">New {singular}</span>
    </Button>
  );
}
