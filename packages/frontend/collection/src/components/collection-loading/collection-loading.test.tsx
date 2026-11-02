import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CollectionLoading } from './collection-loading';

describe('CollectionLoading', () => {
  it.each(['grid', 'list'] as const)(
    'announces once, with text, in the %s layout',
    (layout) => {
      const { container } = render(<CollectionLoading layout={layout} />);
      const statuses = screen.getAllByRole('status');

      expect(statuses).toHaveLength(1);
      expect(statuses[0]?.textContent).toBe('Loading items');
      expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
      expect(container.querySelectorAll('.sr-only')).toHaveLength(1);
      expect(container.querySelector('[aria-label]')).toBeNull();
    },
  );
});
