import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../testing';
import {
  ContrastModeRow,
  EnableAnimationsRow,
  ReducedMotionRow,
  ShowBordersRow,
} from '../appearance-rows';

beforeEach(stubBrowser);
afterEach(() => vi.unstubAllGlobals());

describe.each([
  ['borders', 'Show component borders', ShowBordersRow],
  ['animations', 'Enable animations', EnableAnimationsRow],
  ['reduced-motion', 'Reduce motion', ReducedMotionRow],
])('%s row', (id, label, Row) => {
  it('is a switch named by its label and linked to its description', () => {
    render(<Row value={false} onChange={() => {}} />);
    const toggle = screen.getByRole('switch', { name: label });

    expect(toggle.getAttribute('aria-describedby')).toBe(`${id}-description`);
    expect(
      document.getElementById(`${id}-description`)?.textContent,
    ).toBeTruthy();
  });

  it('reflects its value', () => {
    const { rerender } = render(<Row value={false} onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'false',
    );

    rerender(<Row value onChange={() => {}} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('reports the new value when toggled', () => {
    const onChange = vi.fn();
    render(<Row value={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe.each([
  [
    'borders',
    () => <ShowBordersRow highContrast value={false} onChange={() => {}} />,
    'High contrast always shows borders.',
  ],
  [
    'reduced-motion',
    () => <ReducedMotionRow animationsOff value={false} onChange={() => {}} />,
    'Animations are off, so nothing slides or zooms.',
  ],
])('%s row when another setting supersedes it', (id, renderRow, reason) => {
  it('shows on, is disabled, and says why', () => {
    render(renderRow());
    const toggle = screen.getByRole('switch');

    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.hasAttribute('data-disabled')).toBe(true);
    expect(document.getElementById(`${id}-description`)?.textContent).toBe(
      reason,
    );
  });
});

function expectSelect(id: string, label: string, shown: string) {
  const trigger = screen.getByRole('combobox', { name: label });

  expect(trigger.getAttribute('aria-describedby')).toBe(`${id}-description`);
  expect(trigger.textContent).toContain(shown);
  expect(
    document.getElementById(`${id}-description`)?.textContent,
  ).toBeTruthy();
}

describe('select rows', () => {
  it('names the contrast select and shows the current choice', () => {
    render(<ContrastModeRow value="none" onChange={() => {}} />);
    expectSelect('contrast', 'Contrast', 'Standard');
  });
});
