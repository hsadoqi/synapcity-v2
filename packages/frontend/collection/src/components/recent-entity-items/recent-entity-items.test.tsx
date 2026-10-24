import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CollectionNavigationProvider,
  type CollectionLink,
} from '../../providers';
import type { EntityItem } from '../../types';
import { RecentEntityItems } from './recent-entity-items';

const HostLink: CollectionLink = (props) => <a {...props} data-host-link />;
const inHost = (ui: React.ReactElement) => (
  <CollectionNavigationProvider value={{ Link: HostLink, push: () => {} }}>
    {ui}
  </CollectionNavigationProvider>
);

const doc: EntityItem = {
  id: 'doc-1',
  name: 'Launch plan',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

describe('RecentEntityItems', () => {
  it('renders nothing without items', () => {
    const { container } = render(<RecentEntityItems prefix="/u1/documents" />);

    expect(container.firstChild).toBeNull();
  });

  it('lists each item as a host link under the prefix', () => {
    render(inHost(<RecentEntityItems items={[doc]} prefix="/u1/documents" />));

    const link = screen.getByRole('link', { name: /Launch plan/ });
    expect(link.getAttribute('href')).toBe('/u1/documents/doc-1');
    expect(link.hasAttribute('data-host-link')).toBe(true);
  });

  it('links an item to its own address when it has one', () => {
    render(
      inHost(
        <RecentEntityItems
          items={[{ ...doc, href: '/u1/home/spaces/s1/documents/doc-1' }]}
        />,
      ),
    );

    expect(
      screen.getByRole('link', { name: /Launch plan/ }).getAttribute('href'),
    ).toBe('/u1/home/spaces/s1/documents/doc-1');
  });

  it('lists an item with no address as text, not a link', () => {
    render(inHost(<RecentEntityItems items={[doc]} />));

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Launch plan')).toBeTruthy();
  });
});
