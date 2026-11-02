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
});
