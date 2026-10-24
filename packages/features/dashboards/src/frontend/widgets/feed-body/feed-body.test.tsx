import { emptyRecords } from '@synapcity/domain-prototypes';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SEED_NOW, seededWorkspace } from '../../../testing/seed';
import { FeedBody } from './index';

describe('FeedBody', () => {
  it('lists recent activity, newest first, up to the limit', () => {
    const { container } = render(
      <FeedBody
        activity={seededWorkspace().records.activity}
        limit={2}
        now={SEED_NOW}
      />,
    );
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain('Completed "Draft outline"');
    expect(screen.getByText('4 min ago').tagName).toBe('TIME');
  });

  it('says so when there is no activity', () => {
    render(
      <FeedBody activity={emptyRecords().activity} limit={6} now={SEED_NOW} />,
    );
    expect(screen.getByText('No activity yet.')).toBeDefined();
  });
});
