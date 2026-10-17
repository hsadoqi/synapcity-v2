import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { stubBrowser } from '../../../test-harness';
import {
  ContrastModeRow,
  EnableAnimationsRow,
  FontSizeRow,
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

function expectSelect(id: string, label: string, shown: string) {
  const trigger = screen.getByRole('combobox', { name: label });

  expect(trigger.getAttribute('aria-describedby')).toBe(`${id}-description`);
  expect(trigger.textContent).toContain(shown);
  expect(
    document.getElementById(`${id}-description`)?.textContent,
  ).toBeTruthy();
}

describe('select rows', () => {
  it('names the text size select and shows the current choice', () => {
    render(<FontSizeRow value="medium" onChange={() => {}} />);
    expectSelect('font-size', 'Text size', 'Medium');
  });

  it('names the contrast select and shows the current choice', () => {
    render(<ContrastModeRow value="none" onChange={() => {}} />);
    expectSelect('contrast', 'Contrast', 'Standard');
  });
});
