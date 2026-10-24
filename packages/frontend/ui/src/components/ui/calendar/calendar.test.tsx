import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from '@synapcity/frontend-ui/core/calendar';

const may4 = new Date(2026, 4, 4);
const may9 = new Date(2026, 4, 9);

describe('Calendar', () => {
  it('renders a labelled calendar grid with the package slot', () => {
    const { container } = render(<Calendar defaultMonth={may4} />);

    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeTruthy();
    expect(container.querySelector('[data-slot="calendar"]')).toBeTruthy();
    expect(
      screen
        .getByRole('button', { name: /Monday, May 4th, 2026/ })
        .getAttribute('aria-label'),
    ).toMatch(/^4, Monday/);
  });

  it('reports a day chosen in single-selection mode', () => {
    const onSelect = vi.fn();
    render(<Calendar mode="single" defaultMonth={may4} onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole('button', { name: /Monday, May 4th, 2026/ }),
    );

    expect(onSelect).toHaveBeenCalledWith(
      may4,
      may4,
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('exposes single and range selections on their day buttons', () => {
    const { rerender } = render(
      <Calendar mode="single" month={may4} selected={may4} />,
    );

    expect(
      screen
        .getByRole('button', { name: /Monday, May 4th, 2026/ })
        .getAttribute('data-selected-single'),
    ).toBe('true');

    rerender(
      <Calendar
        key="range"
        mode="range"
        month={may4}
        selected={{ from: may4, to: may9 }}
      />,
    );

    expect(
      screen
        .getByRole('button', { name: /Monday, May 4th, 2026/ })
        .getAttribute('data-range-start'),
    ).toBe('true');
    expect(
      screen
        .getByRole('button', { name: /Saturday, May 9th, 2026/ })
        .getAttribute('data-range-end'),
    ).toBe('true');
  });

  it('disables dates matched by the caller', () => {
    render(
      <Calendar
        mode="single"
        defaultMonth={may4}
        disabled={{ before: may4 }}
      />,
    );

    expect(
      screen
        .getByRole('button', { name: /Sunday, May 3rd, 2026/ })
        .hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen
        .getByRole('button', { name: /Monday, May 4th, 2026/ })
        .hasAttribute('disabled'),
    ).toBe(false);
  });

  it('moves to the next month through its navigation control', () => {
    render(<Calendar defaultMonth={may4} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Go to the Next Month' }),
    );

    expect(screen.getByRole('grid', { name: 'June 2026' })).toBeTruthy();
  });
});
