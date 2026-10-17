import { fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  stubBrowser,
} from '../../test-harness';
import {
  notificationKinds,
  notificationsDefaults,
} from '../../types/notifications';
import { NotificationSettings } from './index';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

const names = {
  email: 'Email notifications',
  push: 'Push notifications',
  sound: 'Notification sounds',
} as const;

describe('NotificationSettings', () => {
  it('has one switch per notification setting, in schema order', async () => {
    await renderWithSettings(<NotificationSettings />);

    expect(
      screen
        .getAllByRole('switch')
        .map((toggle) => toggle.getAttribute('aria-describedby')),
    ).toEqual(
      notificationKinds.map((kind) => `notifications-${kind}-description`),
    );
  });

  it.each(notificationKinds)(
    '%s starts from the stored default',
    async (kind) => {
      await renderWithSettings(<NotificationSettings />);

      expect(
        screen
          .getByRole('switch', { name: names[kind] })
          .getAttribute('aria-checked'),
      ).toBe(String(notificationsDefaults[kind]));
    },
  );

  it.each(notificationKinds)(
    'saves %s without touching the other switches',
    async (kind) => {
      await renderWithSettings(<NotificationSettings />);
      const before = currentSettings().notifications;

      fireEvent.click(screen.getByRole('switch', { name: names[kind] }));

      expect(currentSettings().notifications).toEqual({
        ...before,
        [kind]: !before[kind],
      });
      expect(
        screen
          .getByRole('switch', { name: names[kind] })
          .getAttribute('aria-checked'),
      ).toBe(String(!before[kind]));
    },
  );
});
