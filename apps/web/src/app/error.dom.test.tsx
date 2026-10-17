import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import RouteError from './error';

const fail = (message = 'internal detail', digest = 'abc123') =>
  Object.assign(new Error(message), { digest });

describe('the app error boundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('says something went wrong and offers a retry and a way home', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const retry = vi.fn();
    render(<RouteError error={fail()} retry={retry} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(
      screen
        .getByRole('link', { name: 'Go to the home page' })
        .getAttribute('href'),
    ).toBe('/');
  });

  it('moves focus to the heading so keyboard and screen-reader users land on it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<RouteError error={fail()} retry={() => {}} />);

    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Something went wrong' }),
    );
  });

  it('shows the person none of the error and logs only its digest', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(
      <RouteError error={fail('db password is hunter2')} retry={() => {}} />,
    );

    expect(container.textContent).not.toMatch(/hunter2|internal/i);
    expect(log).toHaveBeenCalledWith('Unexpected error', { digest: 'abc123' });
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/hunter2/);
  });
});
