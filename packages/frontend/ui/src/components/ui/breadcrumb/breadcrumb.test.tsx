import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@synapcity/frontend-ui/core/breadcrumb';

function renderTrail() {
  render(
    <Breadcrumb aria-label="Breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/spaces">Spaces</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Fitness</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
}

describe('Breadcrumb', () => {
  it('is a navigation landmark with an ordered list', () => {
    renderTrail();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav.getAttribute('data-slot')).toBe('breadcrumb');
    expect(nav.querySelector('ol')).not.toBeNull();
  });

  it('links to parent levels', () => {
    renderTrail();

    expect(
      screen.getByRole('link', { name: 'Spaces' }).getAttribute('href'),
    ).toBe('/spaces');
  });

  it('marks the current page and hides the separator from assistive tech', () => {
    renderTrail();

    expect(screen.getByText('Fitness').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      document
        .querySelector('[data-slot="breadcrumb-separator"]')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('merges a caller className', () => {
    render(<BreadcrumbList className="my-4" />);

    expect(
      document.querySelector('[data-slot="breadcrumb-list"]')?.className,
    ).toContain('my-4');
  });
});
