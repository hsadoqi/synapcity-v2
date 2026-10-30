import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AgendaDropdownMenu } from '@/blocks/day-agenda/agenda-dropdown-menu';

describe('AgendaDropdownMenu', () => {
  it('opens its menu from a named trigger', async () => {
    render(<AgendaDropdownMenu />);
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');
    expect(menu.textContent).toContain('Theme');
    expect(menu.textContent).toContain('Settings');
    expect(menu.textContent).toContain('Help');
  });
});

describe('AgendaDropdownMenu items', () => {
  it('renders given items and runs their onSelect', async () => {
    const onSelect = vi.fn();
    render(
      <AgendaDropdownMenu
        items={[
          { label: 'Add event', onSelect },
          { label: 'Archive', disabled: true },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    const menu = await screen.findByRole('menu');
    expect(menu.textContent).not.toContain('Theme');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Add event' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
