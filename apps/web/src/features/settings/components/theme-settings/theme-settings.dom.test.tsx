import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  currentSettings,
  renderWithSettings,
  stubBrowser,
} from '../../test-harness';
import { themeDraftStorageKey } from '../../hooks/use-theme-draft';

const mocks = vi.hoisted(() => ({
  params: null as { userId?: string } | null,
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useParams: () => mocks.params,
}));

const THEME_DRAFT_STORAGE_KEY = themeDraftStorageKey();
import { ThemeSettings } from './index';

beforeEach(() => {
  stubBrowser();
  mocks.params = null;
});
afterEach(() => vi.unstubAllGlobals());

/** Opens the named select and picks an option, the way Base UI expects. */
async function pick(select: string, option: string) {
  fireEvent.click(screen.getByRole('combobox', { name: select }));
  const item = await screen.findByRole('option', { name: option });
  fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
  fireEvent.click(item, { detail: 1 });
}

describe('ThemeSettings', () => {
  it('opens the live preview from the header and keeps it open while a choice is made', async () => {
    await renderWithSettings(<ThemeSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    const figure = await screen.findByRole('figure', { name: 'Live preview' });
    expect(
      figure.querySelector('[aria-hidden]')?.classList.contains('light'),
    ).toBe(true);

    await pick('Color theme', 'Dark');

    // The choice reaches the open preview, which an outside press did not close.
    await waitFor(() =>
      expect(
        screen
          .getByRole('figure', { name: 'Live preview' })
          .querySelector('[aria-hidden]')
          ?.classList.contains('dark'),
      ).toBe(true),
    );
    expect(
      screen.getByRole('button', { name: /^Preview.*unsaved changes$/ }),
    ).toBeTruthy();
  });

  it('shows the control, a preview button and the disclaimer', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(screen.getByRole('combobox', { name: 'Color theme' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeTruthy();
    // Not drawn until asked for.
    expect(screen.queryByRole('figure', { name: 'Live preview' })).toBeNull();
    expect(
      screen.getByText(
        'Follows your device, switching between light and dark with it.',
      ),
    ).toBeTruthy();
  });

  it('outlines the tab as its title, then the Fonts and Shape and spacing sections, and nothing else', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(
      screen.getAllByRole('heading').map((heading) => ({
        level: Number(heading.tagName.slice(1)),
        text: heading.textContent,
      })),
    ).toEqual([
      { level: 2, text: 'Theme' },
      { level: 3, text: 'Fonts' },
      { level: 3, text: 'Shape and spacing' },
    ]);
  });

  it('previews a chosen mode, and switches the workspace only on save', async () => {
    await renderWithSettings(<ThemeSettings />);
    const saveButton = screen.getByRole('button', { name: 'Save changes' });
    expect(saveButton.getAttribute('aria-disabled') === 'true').toBe(true);

    await pick('Color theme', 'Dark');

    await waitFor(() =>
      expect(
        screen.getByText('Always dark, whatever your device is set to.'),
      ).toBeTruthy(),
    );
    expect(screen.getByRole('status').textContent).toBe(
      'You have unsaved changes.',
    );
    expect(currentSettings().theme.mode).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    saveButton.focus();
    fireEvent.click(saveButton);

    await waitFor(() => expect(currentSettings().theme.mode).toBe('dark'));
    await waitFor(() =>
      expect(document.documentElement.classList.contains('dark')).toBe(true),
    );
    expect(saveButton.getAttribute('aria-disabled') === 'true').toBe(true);
    expect(screen.getByRole('status').textContent).toBe('Saved.');
    // Disabled by its own click, yet still focused: keyboard users keep their place.
    expect(document.activeElement).toBe(saveButton);
  });

  it('has nothing to save after a choice is changed back', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Color theme', 'Dark');
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Save changes' })
          .getAttribute('aria-disabled') === 'true',
      ).toBe(false),
    );
    await pick('Color theme', 'System default');

    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Save changes' })
          .getAttribute('aria-disabled') === 'true',
      ).toBe(true),
    );
  });

  it('discards unsaved choices', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Color theme', 'Dark');
    await waitFor(() =>
      expect(
        screen.getByText('Always dark, whatever your device is set to.'),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Color theme' }).textContent,
      ).toContain('System default'),
    );
    expect(currentSettings().theme.mode).toBe('system');
    expect(
      screen
        .getByRole('button', { name: 'Discard' })
        .getAttribute('aria-disabled') === 'true',
    ).toBe(true);
  });

  it('asks before the page closes only while choices are unsaved', async () => {
    await renderWithSettings(<ThemeSettings />);
    const leave = () => {
      const event = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(leave()).toBe(false);

    await pick('Color theme', 'Dark');
    await waitFor(() => expect(leave()).toBe(true));

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(leave()).toBe(false));
  });

  it('shows a font select and preview for headings, body and code', async () => {
    await renderWithSettings(<ThemeSettings />);

    for (const name of ['Heading font', 'Body font', 'Monospace font']) {
      expect(screen.getByRole('combobox', { name })).toBeTruthy();
    }
    for (const name of [
      'Heading font preview',
      'Body font preview',
      'Code font preview',
    ]) {
      expect(screen.getByRole('figure', { name })).toBeTruthy();
    }
  });

  it('previews a chosen font, and saves only the changed field', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Heading font', 'Lora');

    // Fetched for the previews, but not applied to the page yet.
    await waitFor(() =>
      expect(
        document.head.querySelectorAll('link[rel="stylesheet"]'),
      ).toHaveLength(1),
    );
    expect(
      screen
        .getByRole('figure', { name: 'Heading font preview' })
        .style.getPropertyValue('--font-preference-heading'),
    ).toBe("'Lora', serif");
    expect(
      document.documentElement.style.getPropertyValue(
        '--font-preference-heading',
      ),
    ).toBe('');
    expect(currentSettings().theme.headingFont).toBe('default');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(currentSettings().theme.headingFont).toBe('lora'),
    );
    expect(currentSettings().theme).toMatchObject({
      mode: 'system',
      bodyFont: 'default',
      codeFont: 'default',
    });
    await waitFor(() =>
      expect(
        document.documentElement.style.getPropertyValue(
          '--font-preference-heading',
        ),
      ).toBe("'Lora', serif"),
    );
    expect(
      document.head.querySelectorAll('link[rel="stylesheet"]'),
    ).toHaveLength(1);
  });

  it('restores an unsaved draft after leaving and coming back', async () => {
    const first = await renderWithSettings(<ThemeSettings />);
    await pick('Color theme', 'Dark');
    await waitFor(() =>
      expect(sessionStorage.getItem(THEME_DRAFT_STORAGE_KEY)).toBe(
        JSON.stringify({ mode: 'dark' }),
      ),
    );
    first.unmount();

    await renderWithSettings(<ThemeSettings />);

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Color theme' }).textContent,
      ).toContain('Dark'),
    );
    expect(screen.getByRole('status').textContent).toBe(
      'You have unsaved changes.',
    );
    expect(currentSettings().theme.mode).toBe('system');
  });

  it('clears the stored draft once it is saved', async () => {
    await renderWithSettings(<ThemeSettings />);
    await pick('Color theme', 'Dark');
    await waitFor(() =>
      expect(sessionStorage.getItem(THEME_DRAFT_STORAGE_KEY)).not.toBeNull(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() =>
      expect(sessionStorage.getItem(THEME_DRAFT_STORAGE_KEY)).toBeNull(),
    );
  });

  it('ignores a stored draft it does not recognise', async () => {
    sessionStorage.setItem(
      THEME_DRAFT_STORAGE_KEY,
      JSON.stringify({ mode: 'sepia', headingFont: 'comic-sans' }),
    );

    await renderWithSettings(<ThemeSettings />);

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Color theme' }).textContent,
      ).toContain('System default'),
    );
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('lifts the actions into a bar fixed in view only while there is something to save', async () => {
    await renderWithSettings(<ThemeSettings />);
    const bar = () => screen.getByRole('status').parentElement!;
    expect(bar().className).not.toContain('fixed');

    await pick('Color theme', 'Dark');

    await waitFor(() => expect(bar().className).toContain('fixed'));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(bar().className).not.toContain('fixed'));
  });

  it('keeps each person’s draft to themselves on the /[userId]/settings route', async () => {
    sessionStorage.setItem(
      themeDraftStorageKey('someone-else'),
      JSON.stringify({ mode: 'dark' }),
    );
    mocks.params = { userId: 'ada' };

    await renderWithSettings(<ThemeSettings />);
    // Someone else's unsaved choice is not offered.
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Color theme' }).textContent,
      ).toContain('System default'),
    );

    await pick('Color theme', 'Light');
    await waitFor(() =>
      expect(sessionStorage.getItem(themeDraftStorageKey('ada'))).toBe(
        JSON.stringify({ mode: 'light' }),
      ),
    );
    expect(sessionStorage.getItem(THEME_DRAFT_STORAGE_KEY)).toBeNull();
  });
});

describe('ThemeSettings corner radius and density', () => {
  const frame = () =>
    screen
      .getByRole('figure', { name: 'Live preview' })
      .querySelector<HTMLElement>('[aria-hidden]');

  it('offers both, each describing the option chosen', async () => {
    await renderWithSettings(<ThemeSettings />);

    expect(
      screen.getByRole('combobox', { name: 'Corner radius' }).textContent,
    ).toContain('Default');
    expect(
      screen.getByRole('combobox', { name: 'Density' }).textContent,
    ).toContain('Comfortable');
    expect(
      screen.getByText('The standard, lightly softened corners.'),
    ).toBeTruthy();
    expect(screen.getByText('The standard spacing.')).toBeTruthy();

    await pick('Density', 'Compact');
    await waitFor(() =>
      expect(
        screen.getByText(
          'Tighter spacing, except on touch screens where controls stay easy to tap.',
        ),
      ).toBeTruthy(),
    );
  });

  it('previews a choice on the sample only, and changes the page only on save', async () => {
    await renderWithSettings(<ThemeSettings />);
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    await screen.findByRole('figure', { name: 'Live preview' });
    expect(frame()?.dataset.radius).toBe('default');
    expect(frame()?.dataset.density).toBe('comfortable');

    await pick('Corner radius', 'Rounded');
    await pick('Density', 'Spacious');

    await waitFor(() => expect(frame()?.dataset.radius).toBe('rounded'));
    expect(frame()?.dataset.density).toBe('spacious');
    // The page keeps its saved look until the choice is saved.
    expect(document.documentElement.dataset.radius).toBe('default');
    expect(document.documentElement.dataset.density).toBe('comfortable');
    expect(currentSettings().theme.radius).toBe('default');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(currentSettings().theme.radius).toBe('rounded'));
    expect(currentSettings().theme.density).toBe('spacious');
    await waitFor(() =>
      expect(document.documentElement.dataset.radius).toBe('rounded'),
    );
    expect(document.documentElement.dataset.density).toBe('spacious');
  });

  it('discards an unsaved radius', async () => {
    await renderWithSettings(<ThemeSettings />);

    await pick('Corner radius', 'Sharp');
    await waitFor(() =>
      expect(screen.getByText('Square corners everywhere.')).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Corner radius' }).textContent,
      ).toContain('Default'),
    );
    expect(document.documentElement.dataset.radius).toBe('default');
  });

  it('restores an unsaved radius and density kept in session storage', async () => {
    sessionStorage.setItem(
      THEME_DRAFT_STORAGE_KEY,
      JSON.stringify({ radius: 'soft', density: 'compact' }),
    );
    await renderWithSettings(<ThemeSettings />);

    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Corner radius' }).textContent,
      ).toContain('Soft'),
    );
    expect(
      screen.getByRole('combobox', { name: 'Density' }).textContent,
    ).toContain('Compact');
  });
});
