import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntityItemCard } from './entity-item-card';
import {
  CollectionNavigationProvider,
  type CollectionLink,
} from '../../providers';
import type { DocumentItem } from '../../types';

const HostLink: CollectionLink = (props) => <a {...props} data-host-link />;
const inHost = (ui: React.ReactElement) => (
  <CollectionNavigationProvider value={{ Link: HostLink, push: () => {} }}>
    {ui}
  </CollectionNavigationProvider>
);

const document: DocumentItem = {
  id: 'doc-1',
  name: 'Launch plan',
  description: 'Milestones and owners.',
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
};

describe('EntityItemCard', () => {
  it('links to the item under the given slug', () => {
    render(<EntityItemCard entity={document} slug="/u1/documents" />);

    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/u1/documents/doc-1',
    );
  });

  it('shows the name, description and a machine-readable update time', () => {
    const { container } = render(
      <EntityItemCard entity={document} slug="/u1/documents" />,
    );

    expect(screen.getByRole('heading', { name: 'Launch plan' })).toBeTruthy();
    expect(screen.getByText('Milestones and owners.')).toBeTruthy();
    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe(
      document.updatedAt,
    );
  });

  it('has no actions menu unless an action is given', () => {
    const { rerender } = render(
      <EntityItemCard entity={document} slug="/u1/documents" />,
    );
    expect(screen.queryByRole('button', { name: 'More actions' })).toBeNull();

    rerender(
      <EntityItemCard
        entity={document}
        slug="/u1/documents"
        onArchive={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeTruthy();
  });

  it('omits the description when there is none', () => {
    render(
      <EntityItemCard
        entity={{ ...document, description: undefined }}
        slug="/u1/documents"
      />,
    );

    expect(screen.queryByText('Milestones and owners.')).toBeNull();
  });

  it('links through the host link', () => {
    render(inHost(<EntityItemCard entity={document} slug="/u1/documents" />));

    expect(screen.getByRole('link').hasAttribute('data-host-link')).toBe(true);
  });
});
