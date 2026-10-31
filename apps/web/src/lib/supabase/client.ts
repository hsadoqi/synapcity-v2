import { createBrowserSupabaseClient } from '@synapcity/frontend-supabase';

import { getSupabaseEnv } from './env';

export function createClient() {
  return createBrowserSupabaseClient(getSupabaseEnv());
}
