import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@synapcity/frontend-error-reports', () => ({
  reportCaughtError: vi.fn(),
}));

import { NotFoundMessage } from './not-found-message';
import { RouteErrorMessage } from './route-error-message';

describe('the route messages', () => {
  it('say what happened without a shell of their own, so a group layout is not doubled', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <>
        <NotFoundMessage />
        <RouteErrorMessage error={new Error('x')} retry={() => {}} />
      </>,
    );

    expect(
      screen.getByRole('heading', { name: 'We could not find that page' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    ).toBeTruthy();
    expect(container.querySelector('[data-slot$="shell"]')).toBeNull();
    expect(container.querySelector('main')).toBeNull();
  });
});
