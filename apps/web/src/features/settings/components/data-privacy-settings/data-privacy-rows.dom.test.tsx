import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PrivacyConsentRow } from './data-privacy-rows';

describe.each([
  ['analytics', 'Activity tracking'],
  ['errorReports', 'Error reports'],
  ['sharing', 'Data sharing with third parties'],
] as const)('%s row', (purpose, label) => {
  const id = `privacy-${purpose}`;
  const row = (props: { checked?: boolean; blocked?: boolean } = {}) => (
    <PrivacyConsentRow
      purpose={purpose}
      checked={props.checked ?? false}
      blocked={props.blocked ?? false}
      onChange={() => {}}
    />
  );

  it('is a switch named by its label and linked to its description', () => {
    render(row());
    const toggle = screen.getByRole('switch', { name: label });

    // Base UI puts the id on the hidden form input that the label targets.
    expect(document.getElementById(id)).not.toBeNull();
    expect(toggle.getAttribute('aria-describedby')).toBe(`${id}-description`);
    expect(document.getElementById(`${id}-description`)?.textContent).toContain(
      'Off by default',
    );
  });

  it('reflects its value', () => {
    const { rerender } = render(row());
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false',
    );

    rerender(row({ checked: true }));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('reports the new value when toggled', () => {
    const onChange = vi.fn();
    render(
      <PrivacyConsentRow
        purpose={purpose}
        checked={false}
        blocked={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('is disabled and says why when a browser signal blocks it', () => {
    render(row({ blocked: true }));

    expect(screen.getByRole('switch').getAttribute('aria-disabled')).toBe(
      'true',
    );
    expect(document.getElementById(`${id}-description`)?.textContent).toContain(
      'Global Privacy Control',
    );
  });
});
