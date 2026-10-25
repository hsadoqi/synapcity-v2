import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RootContent } from '.';

describe('RootContent', () => {
  it('renders its children inside the main landmark', () => {
    render(
      <RootContent>
        <p>Page content</p>
      </RootContent>,
    );

    expect(screen.getByRole('main')).toBeTruthy();
    expect(screen.getByRole('main').textContent).toBe('Page content');
  });

  it('is the target of the skip link', () => {
    render(<RootContent>content</RootContent>);

    expect(screen.getByRole('main').id).toBe('main-content');
  });

  it('can take programmatic focus without joining the tab order', () => {
    render(<RootContent>content</RootContent>);
    const main = screen.getByRole('main');

    expect(main.getAttribute('tabindex')).toBe('-1');
    main.focus();
    expect(document.activeElement).toBe(main);
  });

  it('is the only main landmark', () => {
    render(<RootContent>content</RootContent>);

    expect(screen.getAllByRole('main')).toHaveLength(1);
  });
});
