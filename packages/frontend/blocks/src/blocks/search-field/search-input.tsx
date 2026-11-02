'use client';

import { Search } from 'lucide-react';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@synapcity/frontend-ui/core/input-group';

/**
 * A search box: a magnifier and a `type="search"` input in one input group.
 * It is only the control, so it can sit in a search form or be handed to a
 * form field by a renderer. `className` lays out the group; every other prop
 * goes to the input. The keyboard's Enter key reads "Search".
 */
export function SearchInput({
  className,
  enterKeyHint = 'search',
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <InputGroup className={className}>
      <InputGroupInput type="search" enterKeyHint={enterKeyHint} {...props} />
      <InputGroupAddon>
        <Search aria-hidden />
      </InputGroupAddon>
    </InputGroup>
  );
}
