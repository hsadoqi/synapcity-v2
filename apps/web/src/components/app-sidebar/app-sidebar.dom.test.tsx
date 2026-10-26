import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import type { RootBreadcrumb } from '@synapcity/frontend-shells';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { appPaletteGroups, appSidebar, type AppSidebarOptions } from '.';

const records = {
  spaces: [{ id: 's1', name: 'Writing' }],
  documents: [{ id: 'd1', name: 'Launch checklist' }],
  dashboards: [],
};
const options = (
  overrides: Partial<AppSidebarOptions> = {},
): AppSidebarOptions => ({
  records,
  onOpenPalette: vi.fn(),
  onSearch: vi.fn(),
  onCreate: vi.fn(),
  ...overrides,
});

const spaces: RootBreadcrumb = {
  label: 'Spaces',
  href: '/u1/home/spaces',
  kind: 'collection',
};
const writing: RootBreadcrumb = {
  label: 'Writing',
  href: '/u1/home/spaces/s1',
  kind: 'space',
};

/** The name the context switcher shows for this trail. */
function switcherLabel(trail: RootBreadcrumb[], pathname = '/u1/home') {
  const { header } = appSidebar('u1', trail, pathname, options());
  const view = render(
    <TooltipProvider>
      <SidebarProvider>{header}</SidebarProvider>
    </TooltipProvider>,
  );
  const name = screen
    .getByRole('button', { name: /^Switch context: / })
    .getAttribute('aria-label');
  view.unmount();
  return name?.replace('Switch context: ', '');
}

// One case per row of the frontend-shells plan's context table (Task 6).
describe('the sidebar context follows the trail', () => {
  it.each<[string, RootBreadcrumb[], string]>([
    ['Home', [], 'Home'],
    ['the Spaces page', [{ label: 'Spaces', kind: 'collection' }], 'Spaces'],
    ['a Space', [spaces, { label: 'Writing', kind: 'space' }], 'Writing'],
    [
      'a document inside a Space',
      [spaces, writing, { label: 'Draft' }],
      'Writing',
    ],
    [
      'the Documents page',
      [{ label: 'Documents', kind: 'collection' }],
      'Documents',
    ],
    [
      'the Dashboards page',
      [{ label: 'Dashboards', kind: 'collection' }],
      'Dashboards',
    ],
    [
      'a document outside any Space',
      [
        { label: 'Documents', href: '/u1/home/documents', kind: 'collection' },
        { label: 'Draft' },
      ],
      'Documents',
    ],
  ])('on %s it shows %s', (_page, trail, expected) => {
    expect(switcherLabel(trail)).toBe(expected);
  });
});

describe('the sidebar sections', () => {
  const sidebar = (
    overrides?: Partial<AppSidebarOptions>,
    pathname = '/u1/home',
  ) => appSidebar('u1', [], pathname, options(overrides));

  it('starts with Home, the command palette, Inbox and Settings', () => {
    const [core] = sidebar().groups;

    expect(core!.title).toBeUndefined();
    expect(core!.items!.map((item) => item.title)).toEqual([
      'Home',
      'Command palette',
      'Inbox',
      'Settings',
    ]);
    expect(core!.items!.map((item) => item.href)).toEqual([
      '/u1/home',
      undefined,
      '#',
      '/u1/settings',
    ]);
    expect(core!.items![0]!.isActive).toBe(true);
  });

  it('opens the palette from its core item', () => {
    const onOpenPalette = vi.fn();
    const [core] = sidebar({ onOpenPalette }).groups;

    core!.items![1]!.onSelect!();
    expect(onOpenPalette).toHaveBeenCalledOnce();
  });

  it('puts a search field next, which hands its query on', () => {
    const onSearch = vi.fn();
    const search = sidebar({ onSearch }).groups[1]!;
    render(
      <TooltipProvider>
        <SidebarProvider>{search.content}</SidebarProvider>
      </TooltipProvider>,
    );

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'garden' },
    });
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).toHaveBeenCalledWith('garden');
  });

  it('gives each collection a link to its page, a create action and its records', () => {
    const onCreate = vi.fn();
    const [, , spaces, documents, dashboards] = sidebar({ onCreate }).groups;

    expect(
      [spaces, documents, dashboards].map((g) => [g!.title, g!.href]),
    ).toEqual([
      ['Spaces', '/u1/home/spaces'],
      ['Documents', '/u1/home/documents'],
      ['Dashboards', '/u1/home/dashboards'],
    ]);
    expect(spaces!.items!.map((i) => [i.title, i.href])).toEqual([
      ['Writing', '/u1/home/spaces/s1'],
    ]);
    expect(documents!.items!.map((i) => i.href)).toEqual([
      '/u1/home/documents/d1',
    ]);
    expect(dashboards!.items).toEqual([]);
    expect(dashboards!.empty).toBe('No dashboards yet');
    expect(spaces!.hideWhenCollapsed).toBe(true);

    expect(documents!.action!.label).toBe('New document');
    documents!.action!.onSelect();
    expect(onCreate).toHaveBeenCalledWith('document');
  });

  it('marks the open record as the current page', () => {
    const [, , spaces] = sidebar({}, '/u1/home/spaces/s1').groups;

    expect(spaces!.items![0]!.isActive).toBe(true);
  });

  it('pins the footer it is given', () => {
    expect(sidebar({ footer: 'Account' }).footer).toBe('Account');
  });
});

describe('the command palette groups', () => {
  it('offers places, the latest records and creating', () => {
    const onCreate = vi.fn();
    const groups = appPaletteGroups('u1', records, onCreate);

    expect(groups.map((g) => g.heading)).toEqual([
      'Go to',
      'Spaces',
      'Documents',
      'Dashboards',
      'Create',
    ]);
    expect(groups[0]!.items.map((i) => i.label)).toEqual([
      'Home',
      'Spaces',
      'Documents',
      'Dashboards',
      'Settings',
    ]);
    expect(groups[1]!.items).toEqual([
      expect.objectContaining({ label: 'Writing', href: '/u1/home/spaces/s1' }),
    ]);

    groups[4]!.items[0]!.onSelect!();
    expect(onCreate).toHaveBeenCalledWith('space');
  });
});
