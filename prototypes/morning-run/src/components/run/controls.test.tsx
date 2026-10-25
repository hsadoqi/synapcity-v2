import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { findBuiltInRun } from '@/lib/runs/catalog';
import type { PickStep, ScaleStep } from '@/lib/runs/schema';
import { StepClock } from '@/lib/timing/clock';
import { BreathingControl } from './breathing-control';
import { PickControl } from './pick-control';
import { ScaleControl } from './scale-control';

const energy = findBuiltInRun('morning')!.steps[0] as ScaleStep;
const gratitude = findBuiltInRun('morning')!.steps[2] as PickStep;
const focus = findBuiltInRun('morning')!.steps[4] as PickStep;

function ScaleHarness() {
  const [value, setValue] = useState<number>();
  return <ScaleControl step={energy} value={value} onChange={setValue} />;
}

describe('ScaleControl', () => {
  it('is one radio group of ten, with one tab stop', () => {
    render(<ScaleHarness />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(10);
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  it('selects on click and names the rating', async () => {
    const user = userEvent.setup();
    render(<ScaleHarness />);
    await user.click(screen.getByRole('radio', { name: '7 of 10' }));
    expect(screen.getByRole('radio', { name: '7 of 10' })).toBeChecked();
    expect(screen.getByText('Pretty good')).toBeInTheDocument();
  });

  it('moves and selects with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<ScaleHarness />);
    await user.click(screen.getByRole('radio', { name: '4 of 10' }));
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('radio', { name: '6 of 10' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '6 of 10' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('radio', { name: '10 of 10' })).toBeChecked();
    await user.keyboard('{Home}');
    expect(screen.getByRole('radio', { name: '1 of 10' })).toBeChecked();
  });
});

function PickHarness({ step }: { step: PickStep }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const toggle = (o: string) =>
    setPicked((p) =>
      step.max === 1
        ? p[0] === o
          ? []
          : [o]
        : p.includes(o)
          ? p.filter((x) => x !== o)
          : p.length < step.max
            ? [...p, o]
            : p,
    );
  return (
    <PickControl
      step={step}
      options={[...step.options, ...custom]}
      picked={picked}
      onToggle={toggle}
      onAddCustom={(o) => {
        setCustom((c) => [...c, o]);
        toggle(o);
      }}
    />
  );
}

describe('PickControl', () => {
  it('pick one is a radio group', () => {
    render(<PickHarness step={focus} />);
    expect(
      screen.getByRole('radiogroup', { name: focus.label }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(focus.options.length);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
  });

  it('pick several is a group of checkboxes with a visible count', () => {
    render(<PickHarness step={gratitude} />);
    expect(
      screen.getByRole('group', { name: gratitude.label }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(
      gratitude.options.length,
    );
    expect(
      screen.getByText(/Choose up to 3\. 0 of 3 chosen/),
    ).toBeInTheDocument();
  });

  it('arrows move focus and space toggles checkboxes without selecting on the way', async () => {
    const user = userEvent.setup();
    render(<PickHarness step={gratitude} />);
    const boxes = screen.getAllByRole('checkbox');
    boxes[0]!.focus();
    await user.keyboard('{ArrowDown}');
    expect(boxes[1]).toHaveFocus();
    expect(boxes.every((b) => b.getAttribute('aria-checked') === 'false')).toBe(
      true,
    );
    await user.keyboard(' ');
    expect(boxes[1]).toBeChecked();
    expect(screen.getByText(/1 of 3 chosen/)).toBeInTheDocument();
  });

  it('arrows select in a radio group', async () => {
    const user = userEvent.setup();
    render(<PickHarness step={focus} />);
    const radios = screen.getAllByRole('radio');
    radios[0]!.focus();
    await user.keyboard('{ArrowDown}');
    expect(radios[1]).toBeChecked();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(radios[radios.length - 1]).toBeChecked();
  });

  it('blocks a fourth pick and says why', async () => {
    const user = userEvent.setup();
    render(<PickHarness step={gratitude} />);
    const boxes = screen.getAllByRole('checkbox');
    for (const b of boxes.slice(0, 3)) await user.click(b);
    expect(boxes[3]).toHaveAttribute('aria-disabled', 'true');
    await user.click(boxes[3]!);
    expect(boxes[3]).not.toBeChecked();
    expect(screen.getByText(/Unselect one to change/)).toBeInTheDocument();
  });

  it('adds your own option with Enter', async () => {
    const user = userEvent.setup();
    render(<PickHarness step={focus} />);
    await user.type(
      screen.getByLabelText('Add your own option'),
      'Sketching{Enter}',
    );
    expect(screen.getByRole('radio', { name: 'Sketching' })).toBeChecked();
  });
});

describe('BreathingControl', () => {
  it('counts down inhale, hold and exhale from the shared clock, and stops with it', async () => {
    let t = 0;
    const clock = new StepClock(() => t);
    clock.setLimit(38_000);
    clock.start();
    render(<BreathingControl clock={clock} durationSec={38} expired={false} />);

    const frame = () =>
      act(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
    await frame();
    expect(screen.getAllByText('Inhale').length).toBeGreaterThan(0);
    expect(screen.getByText('4')).toBeInTheDocument();

    t = 5_000;
    await frame();
    expect(screen.getAllByText('Hold').length).toBeGreaterThan(0);
    expect(screen.getByText('6')).toBeInTheDocument();

    t = 12_000;
    await frame();
    expect(screen.getAllByText('Exhale').length).toBeGreaterThan(0);
    expect(screen.getByText('7')).toBeInTheDocument();

    act(() => clock.pause());
    t = 30_000;
    await frame();
    expect(screen.getAllByText('Exhale').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/paused/i).length).toBeGreaterThan(0);
  });

  it('shows Done when the time is up', () => {
    const clock = new StepClock(() => 0);
    render(<BreathingControl clock={clock} durationSec={38} expired />);
    expect(screen.getAllByText('Done').length).toBeGreaterThan(0);
  });
});

vi.stubGlobal('scrollTo', vi.fn());
