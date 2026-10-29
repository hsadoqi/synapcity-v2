import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@synapcity/frontend-ui/core/command';

// cmdk measures its list; jsdom has no layout, so give it the APIs it calls.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};

const Palette = ({ onSelect = () => {} }: { onSelect?: () => void }) => (
  <Command>
    <CommandInput placeholder="Search" />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Go to">
        <CommandItem onSelect={onSelect}>Home</CommandItem>
        <CommandItem>Settings</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
);

describe('Command', () => {
  it('lists its items under their group heading', () => {
    render(<Palette />);

    expect(screen.getByText('Go to')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('filters the items as you type and says when nothing matches', () => {
    render(<Palette />);
    const input = screen.getByPlaceholderText('Search');

    fireEvent.change(input, { target: { value: 'sett' } });
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Settings',
    ]);

    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('No results found.')).toBeTruthy();
  });

  it('runs an item when it is chosen', () => {
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('option', { name: 'Home' }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('shows in a dialog only while open', async () => {
    const { rerender } = render(
      <CommandDialog open={false}>
        <Palette />
      </CommandDialog>,
    );
    expect(screen.queryByPlaceholderText('Search')).toBeNull();

    rerender(
      <CommandDialog open>
        <Palette />
      </CommandDialog>,
    );
    expect(await screen.findByPlaceholderText('Search')).toBeTruthy();
  });
});
