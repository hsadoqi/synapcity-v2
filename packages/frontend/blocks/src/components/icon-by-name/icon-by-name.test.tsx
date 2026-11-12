import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NamedIcon } from '.';

const iconClass = (container: HTMLElement) =>
  container.querySelector('svg')!.getAttribute('class') ?? '';

describe('NamedIcon', () => {
  it('draws the icon a record names', () => {
    const { container } = render(<NamedIcon name="book-open" />);

    expect(iconClass(container)).toContain('lucide-book-open');
  });

  it('falls back to a folder for an unknown or missing name', () => {
    const unknown = render(<NamedIcon name="not-an-icon" />);
    const missing = render(<NamedIcon name={undefined} />);

    expect(iconClass(unknown.container)).toContain('lucide-folder');
    expect(iconClass(missing.container)).toContain('lucide-folder');
  });

  it('passes svg props through to the icon', () => {
    const { container } = render(
      <NamedIcon name="gauge" aria-hidden="true" data-testid="icon" />,
    );
    const svg = container.querySelector('svg')!;

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('data-testid')).toBe('icon');
  });
});
