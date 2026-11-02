import { describe, expect, it } from 'vitest';

import { settingsDefaults, type Settings } from '../../schemas';
import { displayOf, readAccountPreferences } from '../scope';
import {
  acceptsCache,
  ownerForWrite,
  parseCacheOwner,
  resolveSession,
  serializeCacheOwner,
  type CacheOwner,
  type PreferencesSession,
} from './session';

const ZONE = 'Europe/Paris';

const cached: Settings = {
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'fr' },
  theme: { ...settingsDefaults.theme, density: 'compact', bodyFont: 'lora' },
  appearance: { ...settingsDefaults.appearance, showBorders: true },
};

const guest: PreferencesSession = { kind: 'guest' };
const signedIn = (
  preferences: unknown,
  deviceTimezone: string | null = ZONE,
): PreferencesSession => ({
  kind: 'account',
  userId: 'u1',
  stored: {
    preferences:
      preferences === null ? null : readAccountPreferences(preferences),
    deviceTimezone,
  },
});
const owners = {
  guest: { kind: 'guest', adoptable: true },
  legacyGuest: { kind: 'guest', adoptable: false },
  u1: { kind: 'account', userId: 'u1' },
  u2: { kind: 'account', userId: 'u2' },
} satisfies Record<string, CacheOwner>;

describe('cache owner marker', () => {
  it('round-trips and rejects anything unreadable or of another version', () => {
    for (const owner of Object.values(owners)) {
      expect(parseCacheOwner(serializeCacheOwner(owner))).toEqual(owner);
    }
    for (const raw of [
      null,
      '',
      '{not json',
      '{"v":2,"owner":{"kind":"guest","adoptable":true}}',
      '{"v":1,"owner":{"kind":"account","userId":""}}',
      '{"v":1,"owner":{"kind":"admin"}}',
    ]) {
      expect(parseCacheOwner(raw), String(raw)).toBeNull();
    }
  });

  it('marks a guest write adoptable only when it did not start from a legacy document', () => {
    expect(ownerForWrite(guest, null, false)).toEqual(owners.guest);
    expect(ownerForWrite(guest, null, true)).toEqual(owners.legacyGuest);
    expect(ownerForWrite(guest, owners.legacyGuest, true)).toEqual(
      owners.legacyGuest,
    );
    expect(ownerForWrite(signedIn(null), owners.guest, true)).toEqual(
      owners.u1,
    );
  });

  it('takes up another tab’s document only from the same person', () => {
    expect(acceptsCache(guest, null)).toBe(true);
    expect(acceptsCache(guest, owners.guest)).toBe(true);
    expect(acceptsCache(guest, owners.u1)).toBe(false);
    expect(acceptsCache(signedIn(null), owners.u1)).toBe(true);
    expect(acceptsCache(signedIn(null), owners.u2)).toBe(false);
    expect(acceptsCache(signedIn(null), owners.guest)).toBe(false);
    expect(acceptsCache(signedIn(null), null)).toBe(false);
  });
});

describe('resolveSession as a guest', () => {
  it('keeps a legacy document exactly as it is', () => {
    const result = resolveSession(
      guest,
      { settings: cached, owner: null, setAside: null },
      ZONE,
    );
    expect(result.settings).toStrictEqual(cached);
    expect(result.rewrite).toBe(false);
    expect(result.owner).toBeNull();
    expect(result.sync).toBe('none');
  });

  it('does not honour consent from an unmarked legacy document', () => {
    const legacy = {
      ...cached,
      privacy: {
        ...settingsDefaults.privacy,
        analytics: {
          ...settingsDefaults.privacy.analytics,
          granted: true,
        },
      },
    };
    const result = resolveSession(
      guest,
      { settings: legacy, owner: null, setAside: null },
      ZONE,
    );

    expect(result.settings.privacy).toEqual(settingsDefaults.privacy);
    expect(result.rewrite).toBe(false);
  });

  it('resets the account part an earlier sign-in left, keeping device fields', () => {
    const own = displayOf(settingsDefaults);
    const result = resolveSession(
      guest,
      { settings: cached, owner: owners.u2, setAside: own },
      ZONE,
    );
    expect(result.settings.regional).toEqual(settingsDefaults.regional);
    expect(result.settings.theme.bodyFont).toBe('default');
    expect(result.settings.theme.density).toBe('compact');
    // The account's display override is gone; this device's own values return.
    expect(result.settings.appearance.showBorders).toBe(false);
    expect(result.setAside).toBeNull();
    expect(result.rewrite).toBe(true);
    expect(result.owner).toEqual(owners.guest);
  });
});

describe('resolveSession signed in', () => {
  it('lets a saved row win over whatever was cached, and marks the cache', () => {
    const result = resolveSession(
      signedIn({ regional: { language: 'de' } }),
      { settings: cached, owner: owners.u2, setAside: null },
      ZONE,
    );
    expect(result.settings.regional.language).toBe('de');
    expect(result.settings.theme.bodyFont).toBe('default');
    expect(result.settings.theme.density).toBe('compact');
    expect(result).toMatchObject({
      rewrite: true,
      owner: owners.u1,
      sync: 'synced',
      save: false,
    });
  });

  it('reports a new device zone', () => {
    expect(
      resolveSession(
        signedIn({}, 'Asia/Tokyo'),
        { settings: null, owner: null, setAside: null },
        ZONE,
      ).save,
    ).toBe(true);
  });

  it('applies the display override and sets this device’s own aside', () => {
    const override = { ...displayOf(cached), contrastMode: 'high' as const };
    const result = resolveSession(
      signedIn({ appearanceOverride: override }),
      { settings: cached, owner: owners.u1, setAside: null },
      ZONE,
    );
    expect(result.settings.appearance.contrastMode).toBe('high');
    expect(result.setAside).toEqual(displayOf(cached));
    expect(result.override).toEqual(override);
  });

  it('adopts choices an adoptable guest made before signing in', () => {
    const result = resolveSession(
      signedIn(null),
      { settings: cached, owner: owners.guest, setAside: null },
      ZONE,
    );
    expect(result.settings.regional.language).toBe('fr');
    expect(result.save).toBe(true);
    expect(result.owner).toEqual(owners.u1);
  });

  it('retries its own unsaved choices when the account has no row', () => {
    const result = resolveSession(
      signedIn(null),
      { settings: cached, owner: owners.u1, setAside: null },
      ZONE,
    );
    expect(result.settings.regional.language).toBe('fr');
    expect(result.save).toBe(true);
  });

  it('never adopts a legacy, legacy-derived or other person’s document', () => {
    for (const owner of [null, owners.legacyGuest, owners.u2]) {
      const result = resolveSession(
        signedIn(null),
        { settings: cached, owner, setAside: null },
        ZONE,
      );
      expect(result.settings.regional, JSON.stringify(owner)).toEqual(
        settingsDefaults.regional,
      );
      expect(result.settings.theme.density).toBe('compact');
      expect(result.save).toBe(false);
      expect(result.owner).toEqual(owners.u1);
    }
  });

  it('saves nothing when an adoptable guest made no account choice', () => {
    expect(
      resolveSession(
        signedIn(null),
        { settings: settingsDefaults, owner: owners.guest, setAside: null },
        ZONE,
      ).save,
    ).toBe(false);
  });

  it('shows only its own cache, and touches nothing, when the row cannot be read', () => {
    const failed: PreferencesSession = {
      kind: 'account',
      userId: 'u1',
      stored: null,
    };
    const own = resolveSession(
      failed,
      { settings: cached, owner: owners.u1, setAside: null },
      ZONE,
    );
    expect(own.settings).toBe(cached);
    const other = resolveSession(
      failed,
      { settings: cached, owner: owners.guest, setAside: null },
      ZONE,
    );
    expect(other.settings.regional).toEqual(settingsDefaults.regional);
    for (const result of [own, other]) {
      expect(result).toMatchObject({
        rewrite: false,
        save: false,
        sync: 'unavailable',
      });
    }
    expect(other.owner).toEqual(owners.guest);
  });
});
