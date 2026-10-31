import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PendingEmailProvider, usePendingEmail } from './pending-email';

function Show() {
  return <span data-testid="pending">{String(usePendingEmail())}</span>;
}

describe('PendingEmailProvider', () => {
  it('hands the waiting address to whatever reads it', () => {
    render(
      <PendingEmailProvider pendingEmail="grace@example.com">
        <Show />
      </PendingEmailProvider>,
    );

    expect(screen.getByTestId('pending').textContent).toBe('grace@example.com');
  });

  it('follows the server when the page renders again with a different value', () => {
    const { rerender } = render(
      <PendingEmailProvider pendingEmail="grace@example.com">
        <Show />
      </PendingEmailProvider>,
    );

    rerender(
      <PendingEmailProvider pendingEmail={null}>
        <Show />
      </PendingEmailProvider>,
    );

    expect(screen.getByTestId('pending').textContent).toBe('null');
  });

  it('knows of nothing waiting without a provider, rather than failing', () => {
    render(<Show />);

    expect(screen.getByTestId('pending').textContent).toBe('null');
  });
});
