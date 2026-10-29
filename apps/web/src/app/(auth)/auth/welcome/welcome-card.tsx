'use client';

import type { ComponentProps } from 'react';
import { ProfileSetupCard } from '@synapcity/features-auth/frontend';

import { signInHref } from '@/lib/routing/sign-in-href';

/**
 * The profile card with the app's sign-in route filled in. The card takes the
 * route as a function (ADR-0009), and a function cannot be passed from a
 * Server Component to a Client Component, so the page renders this instead.
 */
export function WelcomeCard(
  props: Omit<ComponentProps<typeof ProfileSetupCard>, 'signInHref'>,
) {
  return <ProfileSetupCard {...props} signInHref={signInHref} />;
}
