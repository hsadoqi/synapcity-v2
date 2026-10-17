import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ScrollArea, ScrollBar } from '@synapcity/frontend-ui/core/scroll-area';

describe('ScrollArea', () => {
  it('renders its children inside a viewport', () => {
    render(
      <ScrollArea data-testid="root">
        <p>Content</p>
      </ScrollArea>,
    );
    const root = screen.getByTestId('root');
    const viewport = root.querySelector('[data-slot="scroll-area-viewport"]');

    expect(root.getAttribute('data-slot')).toBe('scroll-area');
    expect(viewport).not.toBeNull();
    expect(viewport?.contains(screen.getByText('Content'))).toBe(true);
  });

  it('merges a caller className with the relative base', () => {
    render(
      <ScrollArea data-testid="root" className="h-40">
        Content
      </ScrollArea>,
    );
    const { className } = screen.getByTestId('root');

    expect(className).toContain('relative');
    expect(className).toContain('h-40');
  });

  it('forwards other attributes to the root', () => {
    render(
      <ScrollArea data-testid="root" id="notes">
        Content
      </ScrollArea>,
    );

    expect(screen.getByTestId('root').id).toBe('notes');
  });

  it('exposes ScrollBar for composing a custom area', () => {
    expect(typeof ScrollBar).toBe('function');
  });
});
