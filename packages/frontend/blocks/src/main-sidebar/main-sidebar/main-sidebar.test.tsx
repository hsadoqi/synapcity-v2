import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import { MainSidebarShell } from './main-sidebar-shell';

const contexts = [
  { id: 'writing', label: 'Writing', icon: 'pen-line' },
  { id: 'research', label: 'Research', icon: 'search' },
];
const groups = [
  {
    id: 'notes',
    label: 'Notes',
    items: [
      { id: 'draft', label: 'Draft', icon: 'file-text' },
      { id: 'notes', label: 'Notes', icon: 'notebook' },
    ],
  },
  {
    id: 'views',
    label: 'Views',
    items: [],
    empty: 'No views in this context',
  },
];

function renderSidebar({
  defaultOpen = true,
  onSelectContext = vi.fn(),
  onSelectItem = vi.fn(),
} = {}) {
  return {
    onSelectContext,
    onSelectItem,
    ...render(
      <TooltipProvider>
        <MainSidebarShell
          railItems={contexts}
          activeRailItemId="writing"
          railLabel="Contexts"
          onSelectRailItem={onSelectContext}
          panelLabel="Writing"
          panelGroups={groups}
          activePanelItemId="draft"
          onSelectPanelItem={onSelectItem}
          defaultOpen={defaultOpen}
        >
          <p>Selected content</p>
        </MainSidebarShell>
      </TooltipProvider>,
    ),
  };
}

describe('MainSidebarShell', () => {
  it('renders generic rail and grouped panel navigation', () => {
    renderSidebar();

    expect(screen.getByRole('navigation', { name: 'Contexts' })).toBeTruthy();
    expect(
      screen.getByRole('navigation', { name: 'Writing navigation' }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: 'Draft' })
        .getAttribute('aria-current'),
    ).toBe('page');
    expect(screen.getByText('No views in this context')).toBeTruthy();
    expect(screen.getByText('Selected content')).toBeTruthy();
  });

  it('reports panel selection through the generic item contract', () => {
    const { onSelectItem } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'Notes' }));

    expect(onSelectItem).toHaveBeenCalledWith(groups[0]!.items[1]);
  });

  it('reopens a collapsed panel when a rail item is selected', () => {
    const { container, onSelectContext } = renderSidebar({
      defaultOpen: false,
    });
    const collapsibleSidebar = () =>
      container.querySelector('[data-slot="sidebar"][data-state]');

    expect(collapsibleSidebar()?.getAttribute('data-state')).toBe('collapsed');
    fireEvent.click(screen.getByRole('button', { name: 'Research' }));
    expect(onSelectContext).toHaveBeenCalledWith(contexts[1]);
    expect(collapsibleSidebar()?.getAttribute('data-state')).toBe('expanded');
  });
});
