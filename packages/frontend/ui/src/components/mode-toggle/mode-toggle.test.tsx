import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockViewport } from '@synapcity/dev-vitest-config/viewport';
import {
  ModeButton,
  ModeMenu,
  ModeToggle,
} from '@synapcity/frontend-ui/components/mode-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@synapcity/frontend-ui/core/dropdown-menu';
import { ModeProvider } from '@synapcity/frontend-preferences';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
  mockViewport();
});

describe('ModeButton', () => {
  it('is an icon button named Theme', () => {
    render(<ModeButton />);
    const button = screen.getByRole('button', { name: 'Theme' });

    expect(button.getAttribute('data-slot')).toBe('mode-button');
  });
});

describe('ModeMenu', () => {
  const open = async (
    value: 'light' | 'dark' | 'system',
    onUpdate = vi.fn(),
  ) => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <ModeMenu value={value} onUpdate={onUpdate} />
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await screen.findByRole('menu');
    return onUpdate;
  };

  it('offers Light, Dark and System', async () => {
    await open('light');

    expect(
      screen.getAllByRole('menuitemradio').map((el) => el.textContent),
    ).toEqual(['Light', 'Dark', 'System']);
  });

  it('checks the current mode', async () => {
    await open('dark');

    expect(
      screen
        .getByRole('menuitemradio', { name: 'Dark' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Light' })
        .getAttribute('aria-checked'),
    ).toBe('false');
  });

  it('reports the chosen mode', async () => {
    const onUpdate = await open('light');
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'System' }));

    expect(onUpdate).toHaveBeenCalledWith('system');
  });
});

describe('ModeToggle', () => {
  const renderToggle = (
    props = {},
    initialMode: 'light' | 'dark' | 'system' = 'light',
  ) =>
    render(
      <ModeProvider initialMode={initialMode} attribute="class">
        <ModeToggle {...props} />
      </ModeProvider>,
    );

  it('opens a menu of modes from the Theme button', async () => {
    renderToggle();
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));

    expect(await screen.findByRole('menu')).toBeTruthy();
    expect(screen.getAllByRole('menuitemradio')).toHaveLength(3);
  });

  it('checks the mode the provider starts in', async () => {
    renderToggle({}, 'dark');
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));

    expect(
      (await screen.findByRole('menuitemradio', { name: 'Dark' })).getAttribute(
        'aria-checked',
      ),
    ).toBe('true');
  });

  it('switches the document theme when a mode is chosen', async () => {
    renderToggle();
    fireEvent.click(screen.getByRole('button', { name: 'Theme' }));
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('applies a caller className to its wrapper', () => {
    const { container } = renderToggle({ className: 'ml-auto' });

    expect(container.querySelector('.ml-auto')).not.toBeNull();
  });
});
