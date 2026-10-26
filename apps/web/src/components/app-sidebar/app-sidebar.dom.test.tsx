import { render, screen } from '@testing-library/react';
import { SidebarProvider } from '@synapcity/frontend-ui/core/sidebar';
import { TooltipProvider } from '@synapcity/frontend-ui/core/tooltip';
import type { RootBreadcrumb } from '@synapcity/frontend-shells';
import { describe, expect, it } from 'vitest';

import { appSidebar } from '.';

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
  const { header } = appSidebar('u1', trail, pathname);
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
  const titles = (trail: RootBreadcrumb[], pathname = '/u1/home') =>
    appSidebar('u1', trail, pathname).groups.map((group) =>
      group.items.map((item) => item.title),
    );

  it('always starts with the core links, Inbox linking nowhere yet', () => {
    for (const trail of [[], [spaces], [spaces, writing]]) {
      const [core] = appSidebar('u1', trail, '/u1/home').groups;
      expect(core!.title).toBeUndefined();
      expect(core!.items).toEqual([
        { title: 'Home', href: '/u1/home', isActive: true },
        { title: 'Inbox', href: '#' },
      ]);
    }
  });

  it('adds a section for the active context, and none on Home', () => {
    expect(titles([])).toEqual([['Home', 'Inbox']]);

    const inSpace = appSidebar(
      'u1',
      [spaces, writing, { label: 'Draft' }],
      '/x',
    );
    expect(inSpace.groups[1]).toEqual({
      title: 'Writing',
      items: [
        { title: 'Overview', href: '/u1/home/spaces/s1', isActive: false },
      ],
    });
  });

  it('links a collection section to its page when the crumb has no link', () => {
    const { groups } = appSidebar(
      'u1',
      [{ label: 'Documents', kind: 'collection' }],
      '/u1/home/documents',
    );

    expect(groups[1]!.items).toEqual([
      { title: 'Overview', href: '/u1/home/documents', isActive: true },
    ]);
  });

  it('links a Space section to the current page on the Space itself', () => {
    const { groups } = appSidebar(
      'u1',
      [spaces, { label: 'Writing', kind: 'space' }],
      '/u1/home/spaces/s1',
    );

    expect(groups[1]!.items[0]!.href).toBe('/u1/home/spaces/s1');
  });
});
