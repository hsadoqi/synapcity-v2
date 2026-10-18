import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found';

describe('the not-found page', () => {
  it('says the page could not be found and links home', () => {
    render(<NotFound />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'We could not find that page',
      }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Go to the home page' })
        .getAttribute('href'),
    ).toBe('/');
  });

  it("does not confirm that any page exists, since another person's area is a 404 on purpose", () => {
    const { container } = render(<NotFound />);

    expect(container.textContent).not.toMatch(
      /private|permission|forbidden|not allowed|belongs to|another account/i,
    );
  });
});
