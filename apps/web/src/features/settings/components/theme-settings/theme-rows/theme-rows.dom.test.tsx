import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../test-harness';
import { TextSizeRow, ThemeModeRow } from '../theme-rows';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

describe('ThemeModeRow', () => {
  it('is a select named "Color theme" showing the current mode', () => {
    render(<ThemeModeRow value="dark" onChange={() => {}} />);

    expect(
      screen.getByRole('combobox', { name: 'Color theme' }).textContent,
    ).toContain('Dark');
  });

  it.each([
    [
      'system',
      'Follows your device, switching between light and dark with it.',
    ],
    ['light', 'Always light, whatever your device is set to.'],
    ['dark', 'Always dark, whatever your device is set to.'],
  ] as const)(
    'describes what %s does, as the select’s description',
    (mode, text) => {
      render(<ThemeModeRow value={mode} onChange={() => {}} />);

      const select = screen.getByRole('combobox', { name: 'Color theme' });
      expect(
        document.getElementById(select.getAttribute('aria-describedby')!)
          ?.textContent,
      ).toBe(text);
    },
  );

  it('offers light, dark and system default', async () => {
    render(<ThemeModeRow value="light" onChange={() => {}} />);

    fireEvent.click(screen.getByRole('combobox'));

    expect(
      (await screen.findAllByRole('option')).map((o) => o.textContent),
    ).toEqual(['Light', 'Dark', 'System default']);
  });

  it('reports the chosen mode', async () => {
    const onChange = vi.fn();
    render(<ThemeModeRow value="light" onChange={onChange} />);

    fireEvent.click(screen.getByRole('combobox'));
    const item = await screen.findByRole('option', { name: 'System default' });
    fireEvent.pointerDown(item, { pointerType: 'mouse', button: 0 });
    fireEvent.click(item, { detail: 1 });

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('system'));
  });
});

describe('TextSizeRow', () => {
  it('shows the current size as an output named "Text size"', () => {
    render(<TextSizeRow value={115} onChange={() => {}} />);

    const output = screen.getByRole('status', { name: 'Text size' });
    expect(output.textContent).toBe('115%');
    expect(output.getAttribute('aria-describedby')).toBe(
      'text-size-description',
    );
  });

  it('previews the size on its own sample, leaving the caption at the page size', () => {
    render(<TextSizeRow value={130} onChange={() => {}} />);

    const figure = screen.getByRole('figure', { name: 'Text size preview' });
    const sample = figure.querySelector<HTMLElement>('[data-text-size]')!;
    expect(sample.dataset.textSize).toBe('130');
    expect(sample.style.getPropertyValue('--text-scale')).toBe('1.3');
    expect(sample.textContent).toContain('Notes from the week');
    expect(
      figure.querySelector('figcaption')?.closest('[data-text-size]'),
    ).toBeNull();
  });

  it('steps down and up by 5%', () => {
    const onChange = vi.fn();
    render(<TextSizeRow value={100} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Smaller text' }));
    fireEvent.click(screen.getByRole('button', { name: 'Larger text' }));

    expect(onChange.mock.calls).toEqual([[95], [105]]);
  });

  it.each([
    [80, 'Smaller text'],
    [150, 'Larger text'],
  ] as const)(
    'disables the step past its limit at %i%%, keeping it focusable',
    (value, name) => {
      const onChange = vi.fn();
      render(<TextSizeRow value={value} onChange={onChange} />);

      const button = screen.getByRole('button', { name });
      expect(button.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(button);
      expect(onChange).not.toHaveBeenCalled();
    },
  );
});
