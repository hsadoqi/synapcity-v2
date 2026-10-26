import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContentPanel } from '@synapcity/frontend-ui/blocks/content-panel';
import { blockSurface } from '@synapcity/frontend-ui/lib/block-surface';

const panel = (container: HTMLElement) =>
  container.firstElementChild!.firstElementChild!;

describe('ContentPanel', () => {
  it('shows the header and both fields', () => {
    render(
      <ContentPanel
        componentId="Feature Content"
        headingLabel="Heading"
        heading="No tutorials needed."
        descriptionLabel="Description"
        description="Build a website in an afternoon."
      />,
    );

    expect(screen.getByText('Feature Content')).toBeTruthy();
    expect(screen.getByText('No tutorials needed.')).toBeTruthy();
    expect(screen.getByText('Build a website in an afternoon.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Bold' })).toHaveLength(2);
  });

  it('trims the text and drops a field that is only whitespace', () => {
    render(<ContentPanel heading="  Title  " description="   " />);

    expect(screen.getByText('Title').textContent).toBe('Title');
    expect(screen.getAllByRole('button', { name: 'Bold' })).toHaveLength(1);
  });

  it('renders only the header when there is nothing to edit', () => {
    render(<ContentPanel componentId="Empty" />);

    expect(screen.queryByRole('button', { name: 'Bold' })).toBeNull();
  });

  it('shows the locale button only when given a locale', () => {
    const { rerender } = render(<ContentPanel />);
    expect(screen.queryByRole('button', { name: 'Locale' })).toBeNull();

    rerender(<ContentPanel locale="🇪🇸" />);
    expect(screen.getByRole('button', { name: 'Locale' })).toBeTruthy();
  });

  it('takes its colours from the surface', () => {
    const { container, rerender } = render(<ContentPanel />);
    expect(panel(container).className).toContain(blockSurface({}));

    rerender(<ContentPanel surface="glass" inverted />);
    expect(panel(container).className).toContain('theme-dark');
    expect(panel(container).className).toContain('bg-card/60');
  });
});
