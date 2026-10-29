import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { DashboardLinkItem } from '../../../contracts';
import { DashboardConfigProvider } from '../../config';
import { LinkBody, selectLinkItems } from './index';

const item = (
  overrides: Partial<DashboardLinkItem> & Pick<DashboardLinkItem, 'id'>,
): DashboardLinkItem => ({
  kind: 'dashboard',
  name: overrides.id,
  icon: 'layout-dashboard',
  href: `/home/${overrides.id}`,
  pinnedAt: null,
  lastViewedAt: null,
  ...overrides,
});

const ITEMS = [
  item({ id: 'old-pin', pinnedAt: '2026-10-01T00:00:00Z' }),
  item({
    id: 'new-pin',
    kind: 'space',
    pinnedAt: '2026-10-20T00:00:00Z',
    lastViewedAt: '2026-10-21T00:00:00Z',
  }),
  item({ id: 'viewed', lastViewedAt: '2026-10-25T00:00:00Z' }),
  item({ id: 'space-b', kind: 'space', href: null }),
  item({ id: 'doc', kind: 'document' }),
];

describe('selectLinkItems', () => {
  it('pinned: only pinned records, newest pin first', () => {
    expect(selectLinkItems('pinned', ITEMS, 10).map((i) => i.id)).toEqual([
      'new-pin',
      'old-pin',
    ]);
  });

  it('last opened: only records with a last view, most recent first', () => {
    expect(selectLinkItems('last-opened', ITEMS, 10).map((i) => i.id)).toEqual([
      'viewed',
      'new-pin',
    ]);
  });

  it('spaces: only Spaces, in the order given', () => {
    expect(selectLinkItems('spaces', ITEMS, 10).map((i) => i.id)).toEqual([
      'new-pin',
      'space-b',
    ]);
  });

  it('applies the limit and leaves its input alone', () => {
    const copy = [...ITEMS];
    expect(selectLinkItems('pinned', ITEMS, 1)).toHaveLength(1);
    expect(ITEMS).toEqual(copy);
  });
});

function renderBody(
  type: 'pinned' | 'last-opened' | 'spaces',
  items: readonly DashboardLinkItem[],
) {
  return render(
    <DashboardConfigProvider items={items}>
      <LinkBody type={type} limit={6} />
    </DashboardConfigProvider>,
  );
}

describe('LinkBody', () => {
  it('lists links with the kind of each record', () => {
    renderBody('pinned', ITEMS);
    const list = screen.getByRole('list');
    const link = within(list).getByRole('link', { name: 'new-pin' });
    expect(link.getAttribute('href')).toBe('/home/new-pin');
    expect(within(list).getAllByText('Space')).toHaveLength(1);
    expect(within(list).getAllByText('Dashboard')).toHaveLength(1);
  });

  it('shows a record without a page as plain text', () => {
    renderBody('spaces', ITEMS);
    expect(screen.queryByRole('link', { name: 'space-b' })).toBeNull();
    expect(screen.getByText('space-b')).toBeDefined();
  });

  it('renders links through the host link component', () => {
    render(
      <DashboardConfigProvider
        items={ITEMS}
        LinkComponent={({ href, children }) => (
          <a href={href} data-host-link>
            {children}
          </a>
        )}
      >
        <LinkBody type="pinned" limit={6} />
      </DashboardConfigProvider>,
    );
    expect(document.querySelectorAll('[data-host-link]')).toHaveLength(2);
  });

  it.each([
    ['pinned', 'Nothing is pinned yet.'],
    ['last-opened', /Nothing opened yet/],
    ['spaces', 'No Spaces yet.'],
  ] as const)('says so when %s has nothing', (type, message) => {
    renderBody(type, []);
    expect(screen.getByText(message)).toBeDefined();
  });
});
