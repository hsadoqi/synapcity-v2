import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SettingsAccordion, SettingsAccordionItem } from './settings-accordion';

describe('SettingsAccordion', () => {
  const tab = (devices: boolean) => (
    <SettingsAccordion>
      <SettingsAccordionItem value="motion" title="Motion">
        <p>motion rows</p>
      </SettingsAccordionItem>
      {devices && (
        <SettingsAccordionItem value="devices" title="Devices">
          <p>device rows</p>
        </SettingsAccordionItem>
      )}
    </SettingsAccordion>
  );
  const trigger = (name: string) => screen.getByRole('button', { name });

  it('opens every section, each a region named by its h3 trigger', () => {
    render(tab(true));

    expect(trigger('Motion').closest('h3')).not.toBeNull();
    expect(trigger('Motion').getAttribute('aria-expanded')).toBe('true');
    expect(
      screen.getByRole('region', { name: 'Devices' }).textContent,
    ).toContain('device rows');
  });

  it('opens a section that appears later, and keeps one that was closed shut', () => {
    const { rerender } = render(tab(false));
    fireEvent.click(trigger('Motion'));
    expect(trigger('Motion').getAttribute('aria-expanded')).toBe('false');

    rerender(tab(true));

    expect(trigger('Devices').getAttribute('aria-expanded')).toBe('true');
    expect(trigger('Motion').getAttribute('aria-expanded')).toBe('false');
  });
});
