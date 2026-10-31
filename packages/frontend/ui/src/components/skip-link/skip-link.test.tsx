import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkipLinkButton } from '@synapcity/frontend-ui/components/skip-link';

describe('SkipLinkButton', () => {
  it('links to the main content landmark', () => {
    render(<SkipLinkButton />);
    const link = screen.getByRole('link', { name: 'Skip to main content' });

    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('is offscreen until it has focus', () => {
    render(<SkipLinkButton />);
    const { className } = screen.getByRole('link');

    expect(className).toContain('-translate-y-24');
    expect(className).toContain('focus-visible:translate-y-0');
  });

  it('can take keyboard focus', () => {
    render(<SkipLinkButton />);
    const link = screen.getByRole('link');
    link.focus();

    expect(document.activeElement).toBe(link);
  });

  it('moves focus into the main content when chosen', () => {
    render(
      <>
        <SkipLinkButton />
        <main id="main-content" tabIndex={-1} />
      </>,
    );
    fireEvent.click(screen.getByRole('link'));

    expect(document.activeElement).toBe(screen.getByRole('main'));
  });
});
