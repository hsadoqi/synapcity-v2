import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '@synapcity/frontend-ui/core/input';
import { Label } from '@synapcity/frontend-ui/core/label';

describe('Label', () => {
  it('labels the control it points at', () => {
    render(
      <>
        <Label htmlFor="name">Name</Label>
        <Input id="name" />
      </>,
    );

    expect(screen.getByLabelText('Name').id).toBe('name');
  });

  it('marks its slot', () => {
    render(<Label>Name</Label>);

    expect(screen.getByText('Name').getAttribute('data-slot')).toBe('label');
  });

  it('merges a caller className', () => {
    render(<Label className="text-sm">Name</Label>);

    expect(screen.getByText('Name').className).toContain('text-sm');
  });
});
