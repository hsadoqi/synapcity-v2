import type { ProviderFailure } from '@synapcity/server-auth';

export type { ProviderFailure };

/**
 * Reduces any Supabase error (Auth, PostgREST or Storage) to its code and
 * status, the only parts the host may log. The message, details and hint never
 * survive, and a key the error does not carry is left out rather than set to
 * `undefined`.
 */
export function toProviderFailure(error: {
  code?: unknown;
  status?: unknown;
}): ProviderFailure {
  return {
    ...(typeof error.code === 'string' && { code: error.code }),
    ...(typeof error.status === 'number' && { status: error.status }),
  };
}
