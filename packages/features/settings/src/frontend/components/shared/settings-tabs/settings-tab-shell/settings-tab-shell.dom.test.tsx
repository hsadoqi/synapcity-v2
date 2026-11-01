import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SettingsTabShell } from '.';

describe('SettingsTabShell', () => {
  it('shows its title and description', () => {
    render(
      <SettingsTabShell title="Notifications" description="Stay in the loop.">
        <p>Body</p>
      </SettingsTabShell>,
    );

    expect(screen.getByText('Notifications')).toBeTruthy();
    expect(screen.getByText('Stay in the loop.')).toBeTruthy();
  });

  it('renders its children in the card content', () => {
    render(
      <SettingsTabShell title="T" description="D">
        <p>Body</p>
      </SettingsTabShell>,
    );

    expect(
      document
        .querySelector('[data-slot="card-content"]')
        ?.contains(screen.getByText('Body')),
    ).toBe(true);
  });

  describe('layout contract', () => {
    afterEach(() => vi.unstubAllGlobals());

    const draft = {
      hasChanges: false,
      atDefaults: true,
      save: () => {},
      discard: () => {},
      resetAll: () => {},
      isUnsaved: () => false,
      isDefault: () => true,
      resetField: () => {},
    };

    it('clips the card only when roomy, so the footer can stick to the page below that', () => {
      render(
        <SettingsTabShell title="T" description="D" draft={draft}>
          <p>Body</p>
        </SettingsTabShell>,
      );
      const card = document.querySelector('[data-slot="card"]')!;

      // The base Card clips (overflow-hidden). Below roomy the page's own box
      // scrolls, and a clipping card would hold the sticky footer inside it.
      expect(card.className).toContain('overflow-visible');
      expect(card.className).toContain('roomy:overflow-hidden');
      expect(
        document.querySelector('[data-slot="card-footer"]')!.className,
      ).toContain('sticky');
    });

    it('lets the preview rail scroll on its own beside the settings', () => {
      // The wide layout is a rem query the shared viewport helper does not read.
      vi.stubGlobal('matchMedia', (media: string) => ({
        matches: true,
        media,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }));
      render(
        <SettingsTabShell
          title="T"
          description="D"
          preview={{ content: <p>Preview</p> }}
        >
          <p>Body</p>
        </SettingsTabShell>,
      );

      expect(
        document.querySelector('aside[aria-label="Preview"]')!.className,
      ).toContain('overflow-auto');
    });
  });
});
