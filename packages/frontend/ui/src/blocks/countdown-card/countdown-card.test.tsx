import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CountdownCard } from '@synapcity/frontend-ui/blocks/countdown-card';
import { blockSurface } from '@synapcity/frontend-ui/lib/block-surface';

const units = [
  { value: '12', label: 'days' },
  { value: '06', label: 'hrs' },
];
const card = (container: HTMLElement) =>
  container.firstElementChild!.firstElementChild!;

describe('CountdownCard', () => {
  it('shows the title, each unit and the caption', () => {
    render(
      <CountdownCard title="Opens in" units={units} caption="Party time!" />,
    );

    expect(screen.getByText('Opens in')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('days')).toBeTruthy();
    expect(screen.getByText('06')).toBeTruthy();
    expect(screen.getByText('Party time!')).toBeTruthy();
  });

  it('leaves out the title and caption when not given', () => {
    const { container } = render(<CountdownCard units={units} />);

    expect(card(container).querySelectorAll('p')).toHaveLength(4);
  });

  it('takes its colours from the surface and can be bordered', () => {
    const { container, rerender } = render(<CountdownCard />);
    expect(card(container).className).toContain(blockSurface({}));
    expect(card(container).className).not.toContain('border-border');

    rerender(<CountdownCard surface="glass" inverted bordered />);
    expect(card(container).className).toContain('theme-dark');
    expect(card(container).className).toContain('bg-card/60');
    expect(card(container).className).toContain('border');
  });
});
