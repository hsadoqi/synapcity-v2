import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  saveTab,
  stubBrowser,
} from '../../test-harness';
import {
  notificationKinds,
  notificationsDefaults,
} from '@synapcity/domain-preferences';
import { NotificationSettings } from './index';

/** A browser whose notification permission starts at `permission` and becomes `answer` when asked. */
function stubNotification(
  permission: NotificationPermission,
  answer: NotificationPermission = permission,
) {
  const requestPermission = vi.fn(async () => {
    fake.permission = answer;
    return answer;
  });
  const fake = { permission, requestPermission };
  vi.stubGlobal('Notification', fake);
  return requestPermission;
}

beforeEach(() => {
  stubBrowser();
  stubNotification('granted');
});
afterEach(() => vi.unstubAllGlobals());

const names = {
  email: 'Email notifications',
  push: 'Push notifications',
  sound: 'Notification sounds',
} as const;

const pushSwitch = () => screen.getByRole('switch', { name: names.push });

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

  it('says that nothing is sent yet', async () => {
    await renderWithSettings(<NotificationSettings />);

    expect(screen.getByText(/Nothing is sent yet/)).toBeTruthy();
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

      await act(async () => {
        fireEvent.click(screen.getByRole('switch', { name: names[kind] }));
      });
      saveTab();

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

describe('push notifications and browser permission', () => {
  it('asks the browser before turning push on, and saves it once granted', async () => {
    const requestPermission = stubNotification('default', 'granted');
    await renderWithSettings(<NotificationSettings />);

    await act(async () => {
      fireEvent.click(pushSwitch());
    });
    saveTab();

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(currentSettings().notifications.push).toBe(true);
    expect(pushSwitch().getAttribute('aria-checked')).toBe('true');
  });

  it('leaves push off when the person declines the browser prompt', async () => {
    stubNotification('default', 'denied');
    await renderWithSettings(<NotificationSettings />);

    await act(async () => {
      fireEvent.click(pushSwitch());
    });

    expect(currentSettings().notifications.push).toBe(false);
    expect(pushSwitch().getAttribute('aria-checked')).toBe('false');
  });

  it('turns push off without asking the browser anything', async () => {
    const requestPermission = stubNotification('granted');
    await renderWithSettings(<NotificationSettings />);
    await act(async () => {
      fireEvent.click(pushSwitch());
    });
    requestPermission.mockClear();

    await act(async () => {
      fireEvent.click(pushSwitch());
    });

    expect(requestPermission).not.toHaveBeenCalled();
    expect(currentSettings().notifications.push).toBe(false);
  });

  it('shows push as off, read-only, and says why when the browser blocks it', async () => {
    stubNotification('denied');
    await renderWithSettings(<NotificationSettings />);

    expect(pushSwitch().getAttribute('aria-checked')).toBe('false');
    expect(pushSwitch().getAttribute('aria-readonly')).toBe('true');
    expect(
      document.getElementById('notifications-push-description')?.textContent,
    ).toMatch(/blocked for this site in your browser settings/);
  });

  it('says so when the browser cannot show notifications', async () => {
    vi.stubGlobal('Notification', undefined);
    // `'Notification' in window` stays true for an undefined stub, so remove it.
    delete (window as { Notification?: unknown }).Notification;
    await renderWithSettings(<NotificationSettings />);

    expect(pushSwitch().getAttribute('aria-readonly')).toBe('true');
    expect(
      document.getElementById('notifications-push-description')?.textContent,
    ).toMatch(/cannot show notifications/);
  });
});

describe('resetting one notification', () => {
  it('puts the default back in the draft, for Save to keep', async () => {
    await renderWithSettings(<NotificationSettings />);
    const sound = () =>
      screen.getByRole('switch', { name: 'Notification sounds' });
    const before = currentSettings().notifications.sound;

    fireEvent.click(sound());
    saveTab();
    expect(currentSettings().notifications.sound).toBe(!before);

    fireEvent.click(
      screen.getByRole('button', { name: 'Reset Notification sounds' }),
    );
    // In the draft only: the switch shows the default, nothing is saved yet.
    expect(sound().getAttribute('aria-checked')).toBe(String(before));
    expect(currentSettings().notifications.sound).toBe(!before);
    expect(screen.getByText('Unsaved:')).toBeTruthy();

    saveTab();
    expect(currentSettings().notifications.sound).toBe(before);
    expect(
      screen.queryByRole('button', { name: 'Reset Notification sounds' }),
    ).toBeNull();
  });
});
