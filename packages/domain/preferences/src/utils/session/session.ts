import { z } from 'zod';

import { settingsDefaults, type Settings } from '../../schemas';
import { reconcile, type StoredAccountPreferences } from '../reconcile';
import {
  accountPart,
  isDefaultAccount,
  type DisplaySettings,
} from '../scope';

/**
 * Who the preferences in effect belong to. A guest is anyone signed out; an
 * account session carries the row the server read for it, or `null` when that
 * read failed and the account's state is unknown.
 */
export type PreferencesSession =
  | { kind: 'guest' }
  | {
      kind: 'account';
      userId: string;
      stored: StoredAccountPreferences | null;
    };

/**
 * Whose choices the browser's cached document holds (ADR-0010). It is kept
 * beside the document, never inside it, so the document's bytes stay in the
 * shape the boot scripts and earlier builds read. A document with no marker
 * predates it and is "legacy": nobody can tell whose it is.
 *
 * `adoptable` is true only for a guest document that did not start from a
 * legacy one, so first sign-in adoption never uploads data of unknown origin.
 */
export type CacheOwner =
  | { kind: 'guest'; adoptable: boolean }
  | { kind: 'account'; userId: string };

export const CACHE_OWNER_VERSION = 1;

const cacheOwnerSchema = z.object({
  v: z.literal(CACHE_OWNER_VERSION),
  owner: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('guest'), adoptable: z.boolean() }),
    z.object({ kind: z.literal('account'), userId: z.string().min(1) }),
  ]),
});

/** The marker from untrusted storage; anything unreadable counts as absent. */
export function parseCacheOwner(raw: string | null): CacheOwner | null {
  if (!raw) return null;
  try {
    const parsed = cacheOwnerSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.owner : null;
  } catch {
    return null;
  }
}

export function serializeCacheOwner(owner: CacheOwner): string {
  return JSON.stringify({ v: CACHE_OWNER_VERSION, owner });
}

/** The owner a document written now, in this session, belongs to. */
export function ownerForWrite(
  session: PreferencesSession,
  current: CacheOwner | null,
  hasDocument: boolean,
): CacheOwner {
  if (session.kind === 'account') {
    return { kind: 'account', userId: session.userId };
  }
  if (current?.kind === 'guest') return current;
  // An unmarked document is legacy: whoever wrote it, it is never adopted. A
  // document that belonged to an account was reset when the guest arrived.
  return { kind: 'guest', adoptable: current !== null || !hasDocument };
}

/** Whether a document another tab wrote may be taken up by this session. */
export function acceptsCache(
  session: PreferencesSession,
  owner: CacheOwner | null,
): boolean {
  if (session.kind === 'guest') return owner?.kind !== 'account';
  return owner?.kind === 'account' && owner.userId === session.userId;
}

/** What the browser holds before the session is applied. */
export type LocalPreferences = {
  /** The cached document, parsed; null when nothing usable is stored. */
  settings: Settings | null;
  owner: CacheOwner | null;
  /** This device's own display settings, set aside under an account override. */
  setAside: DisplaySettings | null;
};

export type SessionResolution = {
  settings: Settings;
  setAside: DisplaySettings | null;
  /** The account's display override in effect, if any. */
  override: DisplaySettings | null;
  /** Rewrite the cache (and look cookie) now, marked with `owner`. */
  rewrite: boolean;
  owner: CacheOwner | null;
  /** Account persistence: `synced` saves; `unavailable` means the read failed. */
  sync: 'none' | 'synced' | 'unavailable';
  /** Save the account part now: first sign-in adoption or a new device zone. */
  save: boolean;
};

const defaultAccount = accountPart(settingsDefaults);

/** `local` with every account field back at its default, and the device's own display restored. */
function isolated(local: Settings, setAside: DisplaySettings | null): Settings {
  return reconcile(local, defaultAccount, setAside).settings;
}

/**
 * Applies a session to what this browser holds, in one deterministic order
 * (ADR-0010): the account wins for its own part; device fields stay with the
 * device; nothing cached for one person is shown to, or saved for, another.
 *
 * - Guest after an account: account fields go back to their defaults.
 * - Guest with a legacy document: kept as it is, bytes untouched.
 * - Account with a row: the row wins, whoever's document was cached.
 * - Account without a row: the cache is adopted only when it is this
 *   account's own, or an adoptable guest document with non-default choices.
 * - Account whose row could not be read: only this account's own cache shows
 *   through; nothing is rewritten or saved.
 */
export function resolveSession(
  session: PreferencesSession,
  local: LocalPreferences,
  deviceTimezone: string,
): SessionResolution {
  const cached = local.settings ?? settingsDefaults;
  const { owner, setAside } = local;

  if (session.kind === 'guest') {
    if (owner?.kind === 'account') {
      return {
        settings: isolated(cached, setAside),
        setAside: null,
        override: null,
        rewrite: true,
        owner: { kind: 'guest', adoptable: true },
        sync: 'none',
        save: false,
      };
    }
    return {
      settings: cached,
      setAside,
      override: null,
      rewrite: false,
      owner,
      sync: 'none',
      save: false,
    };
  }

  const own = owner?.kind === 'account' && owner.userId === session.userId;
  const accountOwner: CacheOwner = {
    kind: 'account',
    userId: session.userId,
  };

  if (!session.stored) {
    return {
      settings: own ? cached : isolated(cached, setAside),
      setAside: own ? setAside : null,
      override: null,
      rewrite: false,
      owner,
      sync: 'unavailable',
      save: false,
    };
  }

  const { preferences, deviceTimezone: savedZone } = session.stored;
  if (preferences) {
    const reconciled = reconcile(cached, preferences, setAside);
    return {
      settings: reconciled.settings,
      setAside: reconciled.setAside,
      override: preferences.appearanceOverride ?? null,
      rewrite: true,
      owner: accountOwner,
      sync: 'synced',
      save: savedZone !== deviceTimezone,
    };
  }

  const adoptable =
    (own || (owner?.kind === 'guest' && owner.adoptable)) &&
    !isDefaultAccount(accountPart(cached));
  return {
    settings: adoptable
      ? reconcile(cached, accountPart(cached), setAside).settings
      : isolated(cached, setAside),
    setAside: null,
    override: null,
    rewrite: true,
    owner: accountOwner,
    sync: 'synced',
    save: adoptable,
  };
}

/** The outcome of saving the account part (ADR-0010). */
export type SavePreferencesResult =
  { ok: true } | { ok: false; error: string; signedOut?: true };
