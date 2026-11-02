import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LoadingRegion } from '@synapcity/frontend-blocks';

describe('LoadingRegion', () => {
  it('announces its label and marks itself busy', () => {
    render(
      <LoadingRegion label="Loading your recent work">
        <div>placeholder</div>
      </LoadingRegion>,
    );
    const status = screen.getByRole('status');

    expect(status.textContent).toBe('Loading your recent work');
    expect(status.parentElement?.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('placeholder')).toBeTruthy();
  });

  it('keeps its default column when no class is passed', () => {
    render(
      <LoadingRegion label="Loading">
        <div />
      </LoadingRegion>,
    );
    const region = screen.getByRole('status').parentElement;

    expect(region?.className).toBe('flex flex-col gap-10');
  });

  it('merges a layout class, the consumer winning a conflict', () => {
    const { container } = render(
      <LoadingRegion label="Loading" className="min-h-96 flex-1 gap-4 p-5">
        <div />
      </LoadingRegion>,
    );
    const region = screen.getByRole('status').parentElement;
    const classes = region?.className.split(' ') ?? [];

    expect(classes).toEqual(
      expect.arrayContaining(['flex', 'flex-col', 'min-h-96', 'flex-1']),
    );
    expect(classes).toContain('gap-4');
    expect(classes).toContain('p-5');
    expect(classes).not.toContain('gap-10');
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(container.querySelectorAll('[aria-busy="true"]')).toHaveLength(1);
  });
});
