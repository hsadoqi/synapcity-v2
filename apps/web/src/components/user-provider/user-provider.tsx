'use client';

import type { ComponentProps } from 'react';
import { UserProvider as AuthUserProvider } from '@synapcity/features-auth/frontend';

import { createClient } from '@/lib/supabase/client';

/**
 * The auth feature's user provider, bound to this app's browser client. It is a
 * client component of its own because a function (the client factory) cannot be
 * passed from the server layout to a client component.
 */
export function UserProvider(
  props: Omit<ComponentProps<typeof AuthUserProvider>, 'createClient'>,
) {
  return <AuthUserProvider createClient={createClient} {...props} />;
}
