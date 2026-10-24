import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { LinkButton } from '@synapcity/frontend-ui/next/link-button';

describe('LinkButton', () => {
  it('renders a link to its href with its slot', () => {
    render(<LinkButton href="/home">Home</LinkButton>);
    const link = screen.getByRole('link', { name: 'Home' });

    expect(link.getAttribute('href')).toBe('/home');
    expect(link.getAttribute('data-slot')).toBe('link-button');
  });

  it('looks like a button of the chosen variant and size', () => {
    const { rerender } = render(
      <LinkButton href="/a" variant="outline" size="lg">
        A
      </LinkButton>,
    );
    const outline = screen.getByRole('link').className;

    rerender(
      <LinkButton href="/a" variant="ghost" size="sm">
        A
      </LinkButton>,
    );
    expect(screen.getByRole('link').className).not.toBe(outline);
  });

  it('merges a caller className', () => {
    render(
      <LinkButton href="/a" className="w-full">
        A
      </LinkButton>,
    );

    expect(screen.getByRole('link').className).toContain('w-full');
  });

  it('calls onClick', () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
    render(
      <LinkButton href="/a" onClick={onClick}>
        A
      </LinkButton>,
    );
    fireEvent.click(screen.getByRole('link'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is inert when disabled', () => {
    const onClick = vi.fn();
    render(
      <LinkButton href="/a" disabled onClick={onClick}>
        A
      </LinkButton>,
    );
    const link = screen.getByRole('link');
    const notPrevented = fireEvent.click(link);

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(onClick).not.toHaveBeenCalled();
    expect(notPrevented).toBe(false);
  });

  it('stays focusable when enabled', () => {
    render(<LinkButton href="/a">A</LinkButton>);
    const link = screen.getByRole('link');

    expect(link.hasAttribute('tabindex')).toBe(false);
    expect(link.hasAttribute('aria-disabled')).toBe(false);
  });

  it('forwards its ref to the anchor', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <LinkButton href="/a" ref={ref}>
        A
      </LinkButton>,
    );

    expect(ref.current).toBe(screen.getByRole('link'));
  });

  it('passes native anchor attributes through', () => {
    render(
      <LinkButton href="https://example.com" target="_blank" rel="noreferrer">
        Out
      </LinkButton>,
    );
    const link = screen.getByRole('link');

    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noreferrer');
  });
});
