import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EntitySection } from '@synapcity/frontend-ui/blocks/entity/entity-section';
import type { DocumentItem } from '@synapcity/frontend-ui/types/entity';

const item = (n: number): DocumentItem => ({
  id: `doc-${n}`,
  name: `Document ${n}`,
  icon: 'file-text',
  kind: 'document',
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-16T09:30:00.000Z',
});

const props = {
  id: 'documents',
  title: 'Documents',
  viewAllHref: '/u1/documents',
  emptyTitle: 'No documents yet',
  emptyBody: 'Create a document to start writing.',
  emptyIcon: 'file-text',
  createLabel: 'New document',
  prefix: '/u1/home/spaces/s1',
};

describe('EntitySection', () => {
  it('is a region named by its heading', () => {
    render(<EntitySection {...props} items={[item(1)]} total={1} />);

    expect(screen.getByRole('region', { name: /Documents/ })).toBeTruthy();
  });

  it('shows at most four items and links to view all', () => {
    render(
      <EntitySection
        {...props}
        items={[1, 2, 3, 4, 5, 6].map(item)}
        total={6}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    // The button renders as a link, so Base UI gives the anchor role="button".
    const viewAll = screen.getByRole('button', { name: /View all/ });
    expect(viewAll.getAttribute('href')).toBe('/u1/documents');
  });

  it('links each item under the section slug', () => {
    render(<EntitySection {...props} items={[item(1)]} total={1} />);

    expect(
      screen.getByRole('link', { name: /Document 1/ }).getAttribute('href'),
    ).toBe('/u1/home/spaces/s1/documents/doc-1');
  });

  it('shows the empty state and no view-all link without items', () => {
    render(
      <EntitySection
        {...props}
        createHref="/u1/documents/new"
        items={[]}
        total={0}
      />,
    );

    expect(screen.getByText('No documents yet')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'New document' }).getAttribute('href'),
    ).toBe('/u1/documents/new');
    expect(screen.queryByRole('button', { name: /View all/ })).toBeNull();
  });

  it('offers no create control when there is nowhere to create one', () => {
    render(<EntitySection {...props} items={[]} total={0} />);

    expect(screen.queryByRole('link', { name: 'New document' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'New document' })).toBeNull();
  });

  it('names the count with the right plural for screen readers', () => {
    const { rerender } = render(
      <EntitySection
        {...props}
        noun={{ one: 'document', other: 'documents' }}
        items={[item(1)]}
        total={1}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Documents, 1 document',
    );

    rerender(
      <EntitySection
        {...props}
        noun={{ one: 'document', other: 'documents' }}
        items={[item(1), item(2)]}
        total={2}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      'Documents, 2 documents',
    );
  });

  it('shows every item when given a larger limit and no view-all link', () => {
    render(
      <EntitySection
        {...props}
        viewAllHref={undefined}
        limit={10}
        items={[1, 2, 3, 4, 5, 6].map(item)}
        total={6}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /View all/ })).toBeNull();
  });
});
