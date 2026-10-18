import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SpaceIcon } from './index';

describe('SpaceIcon', () => {
  it.each(['pen-line', 'book-open', 'house', 'camera'])(
    'loads the real Lucide icon for %s',
    async (name) => {
      const { container } = render(
        <SpaceIcon name={name} className="size-4" aria-hidden="true" />,
      );

      await waitFor(() => {
        const svg = container.querySelector(`svg.lucide-${name}`);
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute('class')).toContain('size-4');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
      });
    },
  );

  it('shows the folder fallback while a named icon loads', async () => {
    const { container } = render(
      <SpaceIcon name="book-open" aria-hidden="true" />,
    );

    expect(container.querySelector('svg.lucide-folder')).not.toBeNull();
    await waitFor(() => {
      expect(container.querySelector('svg.lucide-book-open')).not.toBeNull();
      expect(container.querySelector('svg.lucide-folder')).toBeNull();
    });
  });

  it.each(['unavailable-icon', '', '__proto__', '<svg />'])(
    'renders the static fallback for an unavailable identifier: %s',
    (name) => {
      const reportError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      try {
        const { container } = render(
          <SpaceIcon name={name} className="size-4" aria-hidden="true" />,
        );

        const svg = container.querySelector('svg.lucide-folder');
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute('class')).toContain('size-4');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
        expect(reportError).not.toHaveBeenCalled();
      } finally {
        reportError.mockRestore();
      }
    },
  );
});
