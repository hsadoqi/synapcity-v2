import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const card = vi.hoisted(() => vi.fn((_props: unknown) => null));
vi.mock('@synapcity/features-auth/frontend', () => ({
  ProfileSetupCard: card,
}));

import { WelcomeCard } from './welcome-card';

describe('WelcomeCard', () => {
  it('gives the card the sign-in route, keeping the page to come back to', () => {
    render(
      <WelcomeCard
        completeProfile={vi.fn()}
        skipProfileSetup={vi.fn()}
        defaultName="Ada"
        imageUrl={null}
        next="/u1/home"
      />,
    );

    const props = card.mock.calls[0]?.[0] as {
      signInHref: (returnTo: string) => string;
      defaultName: string;
    };
    expect(props.defaultName).toBe('Ada');
    expect(props.signInHref('/u1/settings')).toBe(
      '/auth/login?next=%2Fu1%2Fsettings',
    );
  });
});
