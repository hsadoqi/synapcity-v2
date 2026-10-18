import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../test-harness';
import { SettingsSelect } from '../settings-select';

const options = [
  { value: 'a', label: 'Alpha', icon: <svg data-testid="alpha-icon" /> },
  { value: 'b', label: 'Bravo' },
];

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

const mount = (onChange = vi.fn(), value = 'a') => {
  render(
    <>
      <span id="pick-description">Help</span>
      <SettingsSelect
        id="pick"
        value={value}
        onChange={onChange}
        options={options}
      />
    </>,
  );
  return onChange;
};

describe('SettingsSelect', () => {
  it('shows the selected option’s label and icon', () => {
    mount();
    const trigger = screen.getByRole('combobox');

    expect(trigger.textContent).toContain('Alpha');
    expect(screen.getByTestId('alpha-icon')).toBeTruthy();
  });

  it('is linked to its description by id', () => {
    mount();
    const trigger = screen.getByRole('combobox');

    expect(trigger.id).toBe('pick');
    expect(trigger.getAttribute('aria-describedby')).toBe('pick-description');
  });

  it('lists every option', async () => {
    mount();

    fireEvent.click(screen.getByRole('combobox'));

    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(['Alpha', 'Bravo']);
  });

  it('reports the chosen value', async () => {
    const onChange = mount();

    fireEvent.click(screen.getByRole('combobox'));
    const item = await screen.findByRole('option', { name: 'Bravo' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('b'));
  });
});
