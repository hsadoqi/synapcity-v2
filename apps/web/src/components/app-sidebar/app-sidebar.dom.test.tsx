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

// Contexts are Global or a Space; collection pages are surfaces, so they
// leave the switcher on Global (PRODUCT.md: context and surface differ).
describe('the sidebar context follows the trail', () => {
  it.each<[string, RootBreadcrumb[], string]>([
    ['Home', [], 'Global'],
    ['the Spaces page', [{ label: 'Spaces', kind: 'collection' }], 'Global'],
    ['a Space', [spaces, { label: 'Writing', kind: 'space' }], 'Writing'],
    [
      'a document inside a Space',
      [spaces, writing, { label: 'Draft' }],
      'Writing',
    ],
    [
      'the Documents page',
      [{ label: 'Documents', kind: 'collection' }],
      'Global',
    ],
    [
      'the Dashboards page',
      [{ label: 'Dashboards', kind: 'collection' }],
      'Global',
    ],
    [
      'a document outside any Space',
      [
        { label: 'Documents', href: '/u1/home/documents', kind: 'collection' },
        { label: 'Draft' },
      ],
      'Global',
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

  it('starts with Home, Search, Inbox and Settings', () => {
    const [core] = sidebar().groups;

    expect(core!.title).toBeUndefined();
    expect(core!.items!.map((item) => item.title)).toEqual([
      'Home',
      'Search',
      'Inbox',
      'Settings',
    ]);
    expect(core!.items!.map((item) => item.href)).toEqual([
      '/u1/home',
      undefined,
      undefined,
      '/u1/settings',
    ]);
    expect(core!.items![0]!.isActive).toBe(true);
  });

  it('shows Inbox as not built yet instead of linking nowhere', () => {
    const inbox = sidebar().groups[0]!.items![2]!;

    expect(inbox).toMatchObject({ disabled: true, note: 'Soon' });
    expect(inbox.href).toBeUndefined();
  });

  it('opens the palette from its core item', () => {
    const onOpenPalette = vi.fn();
    const [core] = sidebar({ onOpenPalette }).groups;

    core!.items![1]!.onSelect!();
    expect(onOpenPalette).toHaveBeenCalledOnce();
  });

  it('switches between Global, the latest Spaces and all Spaces', async () => {
    const { header } = appSidebar(
      'u1',
      [spaces, writing],
      '/u1/home/spaces/s1',
      options(),
    );
    render(
      <TooltipProvider>
        <SidebarProvider>{header}</SidebarProvider>
      </TooltipProvider>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch context: Writing' }),
    );
    const items = await screen.findAllByRole('menuitem');

    expect(
      items.map((item) => [
        item.textContent?.trim(),
        item.getAttribute('href'),
      ]),
    ).toEqual([
      ['Global', '/u1/home'],
      ['Writing', '/u1/home/spaces/s1'],
      ['All spaces', '/u1/home/spaces'],
    ]);
    expect(items[1]!.getAttribute('aria-current')).toBe('page');
    expect(items[0]!.getAttribute('aria-current')).toBeNull();
  });

  it('gives each collection a link to its page, a create action and its records', () => {
    const onCreate = vi.fn();
    const [, spaces, documents, dashboards] = sidebar({ onCreate }).groups;

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
    // A document's page is not built yet (Milestone 8): listed, not linked.
    expect(documents!.items).toEqual([
      expect.objectContaining({ title: 'Launch checklist', disabled: true }),
    ]);
    expect(documents!.items![0]!.href).toBeUndefined();
    expect(dashboards!.items).toEqual([]);
    expect(dashboards!.empty).toBe('No dashboards yet');
    expect(spaces!.hideWhenCollapsed).toBe(true);

    expect(documents!.action!.label).toBe('New document');
    documents!.action!.onSelect();
    expect(onCreate).toHaveBeenCalledWith('document');
  });

  it('marks the open record as the current page', () => {
    const [, spaces] = sidebar({}, '/u1/home/spaces/s1').groups;

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

    expect(groups[2]!.items).toEqual([
      expect.objectContaining({ label: 'Launch checklist', disabled: true }),
    ]);
    expect(groups[2]!.items[0]!.href).toBeUndefined();

    groups[4]!.items[0]!.onSelect!();
    expect(onCreate).toHaveBeenCalledWith('space');
  });
});
