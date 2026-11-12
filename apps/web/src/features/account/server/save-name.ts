import {
  profileNamesSchema,
  type ProfileState,
} from '@synapcity/features-account/contracts';
import { saveProfileNames, type ProfileNames } from '@synapcity/server-account';

import type { SupabaseServerClient } from '@synapcity/server-supabase';

import { SAVE_FAILED } from '@/lib/access/caller';
import { logFailure } from '@/lib/log-failure';

import type { Caller, MetadataPatch } from './caller';

/** What the name fields submitted, echoed back so a failed save keeps it. */
export type NamesEcho = Pick<ProfileState, 'firstName' | 'lastName' | 'name'>;

const field = (formData: FormData, key: string) => {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
};

/**
 * Reads the first, last and display names a profile form submitted
 * (`firstName`, `lastName`, `name`) and checks them with the account
 * contract's `profileNamesSchema`, so the words match the form's.
 */
export function parseNames(
  formData: FormData,
):
  | { ok: true; names: ProfileNames; echo: NamesEcho }
  | { ok: false; state: ProfileState } {
  const echo: NamesEcho = {
    firstName: field(formData, 'firstName'),
    lastName: field(formData, 'lastName'),
    name: field(formData, 'name'),
  };
  const parsed = profileNamesSchema.safeParse({
    firstName: echo.firstName,
    lastName: echo.lastName,
    displayName: echo.name,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = issue?.path[0];
    const fieldName =
      key === 'firstName' || key === 'lastName' ? key : ('name' as const);
    return {
      ok: false,
      state: { error: issue?.message, fields: [fieldName], ...echo },
    };
  }
  return {
    ok: true,
    names: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName ?? null,
      displayName: parsed.data.displayName ?? null,
    },
    echo,
  };
}

export type NamesSaved =
  { ok: true; patch: MetadataPatch } | { ok: false; state: ProfileState };

/**
 * Saves already-validated names and marks profile setup completed, through
 * the package, in one statement. The failure is logged here by code and
 * status only, and turned into the form's words.
 */
export async function saveNames(
  supabase: SupabaseServerClient,
  caller: Caller,
  names: ProfileNames,
  echo: NamesEcho,
): Promise<NamesSaved> {
  const saved = await saveProfileNames(supabase, caller.id, names);
  if (saved.ok) return saved;
  logFailure('saveProfileNames', saved.failure);
  if (saved.reason === 'first-name-required') {
    return {
      ok: false,
      state: {
        error: 'Enter your first name.',
        fields: ['firstName'],
        ...echo,
      },
    };
  }
  return { ok: false, state: { error: SAVE_FAILED, ...echo } };
}
