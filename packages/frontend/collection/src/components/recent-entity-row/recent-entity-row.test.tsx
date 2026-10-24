import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  CollectionNavigationProvider,
  type CollectionLink,
} from '../../providers';
import type { EntityItem } from '../../types';
import { RecentEntityRow } from './recent-entity-row';

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

describe('RecentEntityRow', () => {
  it('is a host link to the given address', () => {
    render(
      inHost(
        <ul>
          <RecentEntityRow entity={doc} slug="/u1/documents/doc-1" />
        </ul>,
      ),
    );

    const link = screen.getByRole('link', { name: /Launch plan/ });
    expect(link.getAttribute('href')).toBe('/u1/documents/doc-1');
    expect(link.hasAttribute('data-host-link')).toBe(true);
  });
});
