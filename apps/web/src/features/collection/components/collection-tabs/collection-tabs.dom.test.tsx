import { fireEvent, render, screen } from '@testing-library/react';
import { Soup } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import type { CollectionItem } from '../../shared';
import {
  CollectionTabs,
  type CollectionTabDefinition,
} from './collection-tabs';

const NOW = new Date('2026-10-10T12:00:00Z');
const item = (id: string): CollectionItem => ({
  id,
  title: `Title ${id}`,
  updatedAt: NOW.toISOString(),
  tags: [],
  pinned: false,
});

const tab = (id: string, label: string, items: CollectionItem[]) =>
  ({
    id,
    label,
    items,
    view: {
      labels: { singular: id, plural: label },
      icon: Soup,
      emptyState: { title: `No ${id}s`, description: '' },
    },
  }) satisfies CollectionTabDefinition;

const TABS = [
  tab('recipe', 'Recipes', [item('soup'), item('stew')]),
  tab('menu', 'Menus', []),
];

describe('CollectionTabs', () => {
  it('opens on the overview when there is one, then switches to a collection', () => {
    render(
      <CollectionTabs tabs={TABS} now={NOW}>
        <p>Overview content</p>
      </CollectionTabs>,
    );

    expect(screen.getByText('Overview content')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Recipes' }));

    expect(screen.queryByText('Overview content')).toBeNull();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Recipes' }),
    ).toBeTruthy();
    expect(screen.getByText('Title stew')).toBeTruthy();
  });

  it('starts on the first collection without an overview, and shows its empty state when it has no items', () => {
    render(<CollectionTabs tabs={TABS} now={NOW} />);

    expect(screen.queryByRole('tab', { name: 'Overview' })).toBeNull();
    expect(screen.getByText('Title soup')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Menus' }));
    expect(screen.getByText('No menus')).toBeTruthy();
  });

  it('hides the tab bar when there is only one tab', () => {
    render(<CollectionTabs tabs={[TABS[0]!]} now={NOW} />);

    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByText('Title soup')).toBeTruthy();
  });
});
