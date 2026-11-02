import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsTabActive } from '../../shared/settings-tabs/settings-tab-active';
import { themeDefaults } from '@synapcity/domain-preferences';
import { ThemePreviewPopover } from './theme-preview-popover';

const preview = (active: boolean) => (
  <SettingsTabActive value={active}>
    <ThemePreviewPopover theme={themeDefaults} hasChanges={false} />
  </SettingsTabActive>
);

describe('ThemePreviewPopover', () => {
  // Another tab is an outside press, which the preview ignores so it stays
  // open while the form is used; the Theme tab stays mounted while hidden, so
  // without this the preview floated over whichever tab was opened next.
  it('closes when its tab is no longer shown, and stays closed on return', async () => {
    const { rerender } = render(preview(true));

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    await screen.findByRole('figure', { name: 'Live preview' });

    rerender(preview(false));
    await waitFor(() =>
      expect(screen.queryByRole('figure', { name: 'Live preview' })).toBeNull(),
    );

    rerender(preview(true));
    expect(screen.queryByRole('figure', { name: 'Live preview' })).toBeNull();
  });
});
