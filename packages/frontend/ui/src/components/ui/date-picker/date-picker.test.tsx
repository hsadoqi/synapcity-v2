import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  DatePicker,
  DateRangePicker,
} from '@synapcity/frontend-ui/core/date-picker';

const may4 = new Date(2026, 4, 4);

/** Opens the picker and clicks the day whose accessible name contains `day`. */
async function pick(trigger: HTMLElement, day: RegExp) {
  await act(async () => {
    fireEvent.click(trigger);
  });
  const button = await screen.findByRole('button', { name: day });
  await act(async () => {
    fireEvent.click(button);
  });
}

describe('DatePicker', () => {
  it('shows the placeholder until a date is chosen, on a trigger that carries the id and ARIA', () => {
    render(
      <DatePicker
        id="due"
        placeholder="Pick a due date"
        aria-invalid
        aria-describedby="due-error"
      />,
    );
    const trigger = screen.getByRole('button', { name: /Pick a due date/ });
    expect(trigger.id).toBe('due');
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-describedby')).toBe('due-error');
  });

  it('reports the chosen day and closes', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker defaultValue={may4} onValueChange={onValueChange} />);
    await pick(
      screen.getByRole('button', { name: /May 4th, 2026/ }),
      /May 11th, 2026/,
    );
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 4, 11));
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('shows a controlled value and follows it', () => {
    const { rerender } = render(<DatePicker value={may4} />);
    expect(screen.getByRole('button').textContent).toContain('May 4th, 2026');
    rerender(<DatePicker value={undefined} placeholder="None" />);
    expect(screen.getByRole('button').textContent).toContain('None');
  });

  it('writes a yyyy-MM-dd hidden input when given a name, so a plain form post carries it', () => {
    const { container, rerender } = render(
      <DatePicker name="due" value={may4} />,
    );
    const hidden = container.querySelector(
      'input[type="hidden"][name="due"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe('2026-05-04');
    rerender(<DatePicker name="due" value={undefined} />);
    expect(hidden.value).toBe('');
  });

  it('does not let days outside min and max be chosen', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        defaultValue={may4}
        min={new Date(2026, 4, 3)}
        max={new Date(2026, 4, 20)}
        onValueChange={onValueChange}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /May 4th, 2026/ }));
    });
    const before = await screen.findByRole('button', { name: /May 2nd, 2026/ });
    const after = screen.getByRole('button', { name: /May 21st, 2026/ });
    expect(before.hasAttribute('disabled')).toBe(true);
    expect(after.hasAttribute('disabled')).toBe(true);
  });

  it('formats the label with formatValue when given', () => {
    render(<DatePicker value={may4} formatValue={() => '4 May'} />);
    expect(screen.getByRole('button').textContent).toContain('4 May');
  });

  it('cannot be opened when disabled', async () => {
    render(<DatePicker disabled />);
    const trigger = screen.getByRole('button');
    expect(trigger.hasAttribute('disabled')).toBe(true);
    await act(async () => {
      fireEvent.click(trigger);
    });
    expect(screen.queryByRole('grid')).toBeNull();
  });

  it('attaches ref to the trigger, so a form can focus it', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<DatePicker ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('button'));
  });
});

describe('DateRangePicker', () => {
  it('reports a range as both ends are chosen', async () => {
    const onValueChange = vi.fn();
    render(
      <DateRangePicker
        defaultValue={{ from: may4, to: undefined }}
        numberOfMonths={1}
        onValueChange={onValueChange}
      />,
    );
    await pick(
      screen.getByRole('button', { name: /May 04, 2026/ }),
      /May 9th, 2026/,
    );
    expect(onValueChange).toHaveBeenLastCalledWith({
      from: may4,
      to: new Date(2026, 4, 9),
    });
  });

  it('shows both ends of a controlled range', () => {
    render(
      <DateRangePicker value={{ from: may4, to: new Date(2026, 4, 9) }} />,
    );
    const label = screen.getByRole('button').textContent ?? '';
    expect(label).toContain('May 04, 2026');
    expect(label).toContain('May 09, 2026');
  });

  it('writes two hidden inputs when given fromName and toName', () => {
    const { container } = render(
      <DateRangePicker
        fromName="start"
        toName="end"
        value={{ from: may4, to: new Date(2026, 4, 9) }}
      />,
    );
    const value = (name: string) =>
      (container.querySelector(`input[name="${name}"]`) as HTMLInputElement)
        .value;
    expect([value('start'), value('end')]).toEqual([
      '2026-05-04',
      '2026-05-09',
    ]);
  });
});
