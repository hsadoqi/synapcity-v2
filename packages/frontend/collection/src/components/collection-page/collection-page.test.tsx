import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CollectionPage, CollectionPageSkeleton } from './collection-page';

describe('CollectionPage', () => {
  it('shows the heading, the intro and what the page lists', () => {
    render(
      <CollectionPage title="Recipes" intro="Things worth cooking again.">
        <p>The list</p>
      </CollectionPage>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recipes' }),
    ).toBeTruthy();
    expect(screen.getByText('Things worth cooking again.')).toBeTruthy();
    expect(screen.getByText('The list')).toBeTruthy();
  });
});

describe('CollectionPageSkeleton', () => {
  it('keeps the real heading and announces the loading label', () => {
    const { container } = render(
      <CollectionPageSkeleton
        title="Recipes"
        intro="Things worth cooking again."
        loadingLabel="Loading recipes"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Recipes' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('Loading recipes');
    expect(container.firstElementChild?.getAttribute('aria-busy')).toBe('true');
  });
});
