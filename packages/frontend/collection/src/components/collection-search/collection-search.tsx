'use client';

import { Search } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@synapcity/frontend-ui/core/input-group';

type CollectionSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  /** Accessible name for the input, e.g. "Search documents". */
  label: string;
  /** Layout only (width, order, flex) — set by the parent. */
  className?: string;
};

export function CollectionSearch({
  query,
  onQueryChange,
  placeholder,
  label,
  className,
}: CollectionSearchProps) {
  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
      />
    </InputGroup>
  );
}
