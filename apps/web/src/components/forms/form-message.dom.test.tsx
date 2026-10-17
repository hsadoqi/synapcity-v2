import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormMessage } from './form-message';

describe('FormMessage', () => {
  it('renders nothing without an error or message', () => {
    const { container } = render(<FormMessage id="m" state={{}} />);

    expect(container.firstChild).toBeNull();
  });

  it('announces an error as an alert that can take focus', () => {
    render(<FormMessage id="m" state={{ error: 'Wrong password.' }} />);
    const alert = screen.getByRole('alert');

    expect(alert.id).toBe('m');
    expect(alert.textContent).toBe('Wrong password.');
    expect(alert.tabIndex).toBe(-1);
  });

  it('announces a message as a status', () => {
    render(<FormMessage id="m" state={{ message: 'Saved.' }} />);
    const status = screen.getByRole('status');

    expect(status.id).toBe('m');
    expect(status.textContent).toBe('Saved.');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the error when both are set', () => {
    render(
      <FormMessage id="m" state={{ error: 'Failed.', message: 'Saved.' }} />,
    );

    expect(screen.getByRole('alert').textContent).toBe('Failed.');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
