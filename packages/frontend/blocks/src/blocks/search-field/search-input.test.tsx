import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SearchInput } from '.';

describe('SearchInput', () => {
  it('is a search input with a Search enter key', () => {
    render(<SearchInput aria-label="Find" />);
    const input = screen.getByLabelText('Find') as HTMLInputElement;

    expect(input.type).toBe('search');
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(input.getAttribute('data-slot')).toBe('input-group-control');
  });

  it('hides the magnifier from assistive tech', () => {
    const { container } = render(<SearchInput aria-label="Find" />);

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('passes input props through and lays out the group with className', () => {
    const onChange = vi.fn();
    const { container } = render(
      <SearchInput
        aria-label="Find"
        className="w-64"
        value="ivy"
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Find'), {
      target: { value: 'ivy league' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector('[data-slot="input-group"]')?.className,
    ).toContain('w-64');
  });
});
