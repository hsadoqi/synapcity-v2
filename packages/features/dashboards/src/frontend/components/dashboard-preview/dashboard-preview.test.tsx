import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { sampleSummaries } from '../../../testing';
import { toCollectionItem } from '../../utils/collection-item';
import { DashboardPreview } from './dashboard-preview';

describe('DashboardPreview', () => {
  it('shows the title, description, Space count and tags', () => {
    render(
      <DashboardPreview
        item={toCollectionItem(sampleSummaries[0]!, '/u1/home')}
      />,
    );

    expect(screen.getByText('Project status')).toBeTruthy();
    expect(
      screen.getByText('Where each project stands this week.'),
    ).toBeTruthy();
    expect(screen.getByText('In 2 spaces')).toBeTruthy();
    expect(
      screen.getAllByRole('listitem').map((tag) => tag.textContent),
    ).toEqual(['work']);
  });

  it('leaves out the description and tags when there are none', () => {
    render(
      <DashboardPreview
        item={toCollectionItem(
          { ...sampleSummaries[4]!, tags: [] },
          '/u1/home',
        )}
      />,
    );

    expect(screen.getByText('Weekly plan')).toBeTruthy();
    expect(screen.queryByRole('list', { name: 'Tags' })).toBeNull();
    expect(screen.getByText('Not in a space')).toBeTruthy();
    expect(document.querySelectorAll('p')).toHaveLength(2);
  });
});
