import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from './button';

describe('Button', () => {
  it('labels itself "button" unless given a label', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'button' })).toBeTruthy();
  });

  it('uses the label as its accessible name', () => {
    render(<Button label="Save note">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save note' })).toBeTruthy();
  });

  it('applies the default variant and size', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button').getAttribute('data-slot')).toBe('button');
  });
});
