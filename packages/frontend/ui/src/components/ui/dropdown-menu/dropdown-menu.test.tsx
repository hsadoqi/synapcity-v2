import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';

const open = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
  await screen.findByRole('menu');
};

describe('DropdownMenu', () => {
  it('is closed until the trigger is activated', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    expect(screen.queryByRole('menu')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Menu' }).getAttribute('data-slot'),
    ).toBe('dropdown-menu-trigger');

    await open();

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeTruthy();
  });

  it('runs an item handler and closes', async () => {
    const onClick = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={onClick}>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('marks item variant and slot', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();

    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    expect(rename.getAttribute('data-slot')).toBe('dropdown-menu-item');
    expect(rename.getAttribute('data-variant')).toBe('default');
    expect(
      screen
        .getByRole('menuitem', { name: 'Delete' })
        .getAttribute('data-variant'),
    ).toBe('destructive');
  });

  it('renders groups, labels, separators and shortcuts', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuItem>
              Profile
              <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();

    expect(screen.getByText('Account').getAttribute('data-slot')).toBe(
      'dropdown-menu-label',
    );
    expect(screen.getByText('⌘P').getAttribute('data-slot')).toBe(
      'dropdown-menu-shortcut',
    );
    expect(screen.getByRole('separator').getAttribute('data-slot')).toBe(
      'dropdown-menu-separator',
    );
  });

  it('toggles a checkbox item', async () => {
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem
            checked={false}
            onCheckedChange={onCheckedChange}
          >
            Show hidden
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();
    fireEvent.click(
      screen.getByRole('menuitemcheckbox', { name: 'Show hidden' }),
    );

    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('selects a radio item', async () => {
    const onValueChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b">B</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();

    expect(
      screen
        .getByRole('menuitemradio', { name: 'A' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'B' }));
    expect(onValueChange).toHaveBeenCalledWith('b', expect.any(Object));
  });

  it('closes on Escape', async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await open();
    fireEvent.keyDown(screen.getByRole('menuitem'), { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });
});
