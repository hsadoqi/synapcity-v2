'use client';

import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export type CurrentUserProfile = {
  name: string | null;
  imageUrl: string | null;
};

const SIGNED_OUT: CurrentUserProfile = { name: null, imageUrl: null };

/**
 * Display-only profile of the signed-in user, read from the verified JWT
 * claims (`getClaims`, not `getSession`, per ADR-0006). Never use it to
 * authorize anything: the server checks that itself.
 */
export function useCurrentUserProfile(): CurrentUserProfile {
  const [profile, setProfile] = useState<CurrentUserProfile>(SIGNED_OUT);

  useEffect(() => {
    let active = true;

    createClient()
      .auth.getClaims()
      .then(({ data }) => {
        if (!active) return;
        const meta = data?.claims.user_metadata;
        setProfile({
          name: meta?.full_name ?? meta?.name ?? null,
          imageUrl: meta?.avatar_url ?? null,
        });
      });

    return () => {
      active = false;
    };
  }, []);

  return profile;
}
