import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationSettings } from '../../notification-settings';
import {
  currentSettings,
  renderWithSettings,
  stubBrowser,
} from '../../../testing';
import { SettingsDraftsProvider } from './settings-drafts';
import { UnsavedChangesGuard } from './unsaved-changes-guard';

beforeEach(stubBrowser);

// Counts the clicks that reach the link's own handler (where a Next Link
// navigates), and stops jsdom, which cannot navigate, from trying.
const followed = vi.fn((event: React.MouseEvent) => event.preventDefault());

async function mount() {
  followed.mockClear();
  await renderWithSettings(
    <SettingsDraftsProvider>
      <NotificationSettings />
      {/* A plain link: the guard acts on the click in the page, whatever
          renders the link (a Next Link renders this same element). */}
      <a href="/elsewhere" onClick={followed}>
        Leave
      </a>
      <a href="#regional" onClick={followed}>
        Regional tab
      </a>
      <UnsavedChangesGuard />
    </SettingsDraftsProvider>,
  );
}

const sound = () => screen.getByRole('switch', { name: 'Notification sounds' });

describe('UnsavedChangesGuard', () => {
  it('lets a link through while nothing is unsaved', async () => {
    await mount();
    fireEvent.click(screen.getByRole('link', { name: 'Leave' }));
    expect(followed).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('holds a link that leaves with unsaved changes, and names the tab', async () => {
    await mount();
    fireEvent.click(sound());
    fireEvent.click(screen.getByRole('link', { name: 'Leave' }));

    expect(followed).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog.textContent).toContain(
      'Notifications has changes you have not saved.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(followed).not.toHaveBeenCalled();
    // Still unsaved, still in the draft.
    expect(sound().getAttribute('aria-checked')).toBe('false');
  });

  it('saves, then follows the link', async () => {
    await mount();
    const before = currentSettings().notifications.sound;
    fireEvent.click(sound());
    fireEvent.click(screen.getByRole('link', { name: 'Leave' }));
    await screen.findByRole('alertdialog');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });

    expect(currentSettings().notifications.sound).toBe(!before);
    expect(followed).toHaveBeenCalledOnce();
  });

  it('discards, then follows the link', async () => {
    await mount();
    const before = currentSettings().notifications.sound;
    fireEvent.click(sound());
    fireEvent.click(screen.getByRole('link', { name: 'Leave' }));
    await screen.findByRole('alertdialog');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    });

    expect(currentSettings().notifications.sound).toBe(before);
    expect(followed).toHaveBeenCalledOnce();
  });

  // A tab's #hash stays on this page, and the draft stays with it.
  it('lets a link within this page through', async () => {
    await mount();
    fireEvent.click(sound());
    fireEvent.click(screen.getByRole('link', { name: 'Regional tab' }));
    expect(followed).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});
