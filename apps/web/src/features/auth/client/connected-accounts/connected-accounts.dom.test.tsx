import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  ConnectedAccountsProvider,
  useConnectedAccounts,
} from './connected-accounts';

function Show() {
  return (
    <span data-testid="accounts">
      {useConnectedAccounts()
        .map((item) => `${item.provider}:${item.detail}`)
        .join(',')}
    </span>
  );
}

describe('ConnectedAccountsProvider', () => {
  it('hands the linked accounts to whatever reads them', () => {
    render(
      <ConnectedAccountsProvider
        accounts={[{ provider: 'google', detail: 'ada@gmail.com' }]}
      >
        <Show />
      </ConnectedAccountsProvider>,
    );

    expect(screen.getByTestId('accounts').textContent).toBe(
      'google:ada@gmail.com',
    );
  });

  it('follows the server when the page renders again with different accounts', () => {
    const { rerender } = render(
      <ConnectedAccountsProvider accounts={[]}>
        <Show />
      </ConnectedAccountsProvider>,
    );

    rerender(
      <ConnectedAccountsProvider
        accounts={[{ provider: 'github', detail: 'ada-l' }]}
      >
        <Show />
      </ConnectedAccountsProvider>,
    );

    expect(screen.getByTestId('accounts').textContent).toBe('github:ada-l');
  });

  it('knows of none without a provider, rather than failing', () => {
    render(<Show />);

    expect(screen.getByTestId('accounts').textContent).toBe('');
  });
});
