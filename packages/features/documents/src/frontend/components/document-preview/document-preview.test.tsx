import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sampleSummaries } from '../../../testing';
import { toCollectionItem } from '../../utils';
import { DocumentPreview } from './document-preview';

describe('DocumentPreview', () => {
  it('shows the title, description, Space count and tags', () => {
    render(
      <DocumentPreview
        item={toCollectionItem(sampleSummaries[0]!, '/u1/home')}
      />,
    );

    expect(screen.getByText('Launch plan')).toBeTruthy();
    expect(
      screen.getByText('Steps, owners, and dates for the spring launch.'),
    ).toBeTruthy();
    expect(screen.getByText('In 2 spaces')).toBeTruthy();
    expect(
      screen.getAllByRole('listitem').map((tag) => tag.textContent),
    ).toEqual(['work', 'planning']);
  });

  it('leaves out the description and tags when there are none', () => {
    render(
      <DocumentPreview
        item={toCollectionItem(
          { ...sampleSummaries[3]!, tags: [] },
          '/u1/home',
        )}
      />,
    );

    expect(screen.getByText('Packing list')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull();
    expect(screen.getByText('Not in a space')).toBeTruthy();
    expect(document.querySelectorAll('p')).toHaveLength(2);
  });
});
