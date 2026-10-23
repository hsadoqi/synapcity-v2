import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { EntityIcon } from '@synapcity/frontend-ui/blocks/entity/entity-icon';

describe('EntityIcon', () => {
  it.each(['pen-line', 'book-open', 'house', 'camera'])(
    'renders the Lucide icon for %s straight away',
    (name) => {
      const { container } = render(
        <EntityIcon name={name} className="size-4" aria-hidden="true" />,
      );

      const svg = container.querySelector(`svg.lucide-${name}`);
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('class')).toContain('size-4');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    },
  );

  it('renders its icon on the server, with nothing left to load', () => {
    expect(renderToString(<EntityIcon name="book-open" />)).toContain(
      'lucide-book-open',
    );
  });

  it.each([
    'unavailable-icon',
    'alarm-clock', // a real Lucide icon, but outside the fixed set
    '',
    '__proto__',
    'constructor',
    '<svg />',
  ])('renders the folder for an identifier outside the set: %s', (name) => {
    const reportError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { container } = render(
        <EntityIcon name={name} className="size-4" aria-hidden="true" />,
      );

      const svg = container.querySelector('svg.lucide-folder');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('class')).toContain('size-4');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
      expect(reportError).not.toHaveBeenCalled();
    } finally {
      reportError.mockRestore();
    }
  });
});
