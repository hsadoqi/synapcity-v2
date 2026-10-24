import { describe, expect, it } from 'vitest';

import { settingsDefaults, type Settings } from '../../schemas';
import { displayOf, readAccountPreferences } from '../scope';
import { reconcile } from './reconcile';

const local: Settings = {
  ...settingsDefaults,
  regional: { ...settingsDefaults.regional, language: 'fr' },
  appearance: { ...settingsDefaults.appearance, showBorders: true },
};

describe('reconcile', () => {
  it('applies the account over this device', () => {
    const account = readAccountPreferences({ regional: { language: 'de' } });

    const result = reconcile(local, account, null);

    expect(result.settings.regional.language).toBe('de');
    expect(result.setAside).toBeNull();
  });

  it('sets this device’s display aside while the account overrides it', () => {
    const account = readAccountPreferences({
      appearanceOverride: { ...displayOf(local), showBorders: false },
    });

    const result = reconcile(local, account, null);

    expect(result.setAside).toEqual(displayOf(local));
    expect(result.settings.appearance.showBorders).toBe(false);
  });

  it('brings the set-aside display back when the override ends', () => {
    const account = readAccountPreferences({});

    const result = reconcile(
      { ...local, appearance: { ...local.appearance, showBorders: false } },
      account,
      displayOf(local),
    );

    expect(result.settings.appearance.showBorders).toBe(true);
    expect(result.setAside).toBeNull();
  });
});
