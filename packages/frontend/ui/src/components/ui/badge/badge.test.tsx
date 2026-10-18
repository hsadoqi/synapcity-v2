import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Badge, badgeVariants } from '@synapcity/frontend-ui/core/badge';

describe('Badge', () => {
  it('renders a non-interactive span by default', () => {
    render(<Badge>Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.tagName).toBe('SPAN');
    expect(badge.getAttribute('data-slot')).toBe('badge');
    expect(badge.getAttribute('data-variant')).toBe('default');
    expect(badge.hasAttribute('tabindex')).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each([
    ['default', 'bg-primary', 'text-primary-foreground'],
    ['secondary', 'bg-secondary', 'text-secondary-foreground'],
    ['destructive', 'bg-destructive/10', 'text-destructive'],
    ['outline', 'border-border', 'text-foreground'],
    ['ghost', 'hover:bg-muted', 'hover:text-muted-foreground'],
    ['link', 'text-primary', 'hover:underline'],
  ] as const)(
    'renders the %s variant with its semantic styles',
    (variant, background, foreground) => {
      render(<Badge variant={variant}>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge.getAttribute('data-variant')).toBe(variant);
      expect(badge.classList.contains(background)).toBe(true);
      expect(badge.classList.contains(foreground)).toBe(true);
      expect(badge.hasAttribute('variant')).toBe(false);
    },
  );

  it('preserves arbitrary children and icon placement markers', () => {
    render(
      <Badge>
        <svg aria-hidden="true" data-icon="inline-start" />
        <span>3 updates</span>
      </Badge>,
    );
    const badge = screen.getByText('3 updates').parentElement;
    expect(badge?.querySelector('svg')?.getAttribute('data-icon')).toBe(
      'inline-start',
    );
    expect(badge?.textContent).toBe('3 updates');
  });

  it('merges layout classes and resolves conflicting utilities', () => {
    render(<Badge className="h-6 mt-2">Draft</Badge>);
    const badge = screen.getByText('Draft');
    expect(badge.classList.contains('h-6')).toBe(true);
    expect(badge.classList.contains('h-5')).toBe(false);
    expect(badge.classList.contains('mt-2')).toBe(true);
    expect(badge.classList.contains('rounded-full')).toBe(true);
  });

  it('forwards native, data and accessibility attributes', () => {
    render(
      <Badge
        id="status"
        title="Unpublished"
        data-testid="badge"
        aria-label="Document status: draft"
        aria-invalid
      >
        Draft
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge.id).toBe('status');
    expect(badge.title).toBe('Unpublished');
    expect(badge.getAttribute('aria-label')).toBe('Document status: draft');
    expect(badge.getAttribute('aria-invalid')).toBe('true');
  });

  it('forwards a ref to the default element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref}>Draft</Badge>);
    expect(ref.current).toBe(screen.getByText('Draft'));
  });

  it('composes a link without an extra wrapper', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Badge variant="outline" render={<a href="#details" ref={ref} />}>
        Details
      </Badge>,
    );
    const link = screen.getByRole('link', { name: 'Details' });
    expect(link.getAttribute('href')).toBe('#details');
    expect(link.getAttribute('data-slot')).toBe('badge');
    expect(link.getAttribute('data-variant')).toBe('outline');
    expect(ref.current).toBe(link);
    expect(link.querySelector('[data-slot="badge"]')).toBeNull();
  });

  it('merges handlers and classes supplied by a render element', () => {
    const onClick = vi.fn();
    const onRenderClick = vi.fn();
    render(
      <Badge
        className="mt-2"
        onClick={onClick}
        render={
          <button type="button" className="ms-2" onClick={onRenderClick} />
        }
      >
        Filter
      </Badge>,
    );
    const button = screen.getByRole('button', { name: 'Filter' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRenderClick).toHaveBeenCalledTimes(1);
    expect(button.classList.contains('mt-2')).toBe(true);
    expect(button.classList.contains('ms-2')).toBe(true);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('preserves badge props through a render callback', () => {
    render(
      <Badge
        variant="secondary"
        render={(props) => <a {...props} href="#status" />}
      >
        Status
      </Badge>,
    );
    const link = screen.getByRole('link', { name: 'Status' });
    expect(link.getAttribute('data-variant')).toBe('secondary');
    expect(link.getAttribute('data-slot')).toBe('badge');
  });
});

describe('badgeVariants', () => {
  it('defaults to the default variant when omitted', () => {
    expect(badgeVariants()).toBe(badgeVariants({ variant: 'default' }));
  });

  it('accepts an additional class for direct consumers', () => {
    expect(badgeVariants({ className: 'mt-2' }).split(' ')).toContain('mt-2');
  });
});
