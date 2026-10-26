import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MotionPanel } from '@synapcity/frontend-ui/blocks/settings-view';

const sections = [
  {
    label: 'Images',
    rows: [
      { label: 'Image entrance', value: 'Blur in' },
      { label: 'Scroll effect', value: 'Parallax' },
    ],
  },
  { label: 'Motion', rows: [{ label: 'Animation speed', value: 'Slow' }] },
];
const value = (text: string) => screen.getByText(text).closest('span')!;

describe('MotionPanel', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('shows every label at once and fills the values in one step at a time', () => {
    render(
      <MotionPanel
        sectionLabel="Appearance"
        sections={sections}
        stepMs={100}
      />,
    );

    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('Images')).toBeTruthy();
    expect(screen.getByText('Animation speed')).toBeTruthy();
    expect(value('Blur in').className).toContain('invisible');

    act(() => vi.advanceTimersByTime(100));
    expect(value('Blur in').className).not.toContain('invisible');
    expect(value('Parallax').className).toContain('invisible');

    act(() => vi.advanceTimersByTime(100));
    act(() => vi.advanceTimersByTime(100));
    expect(value('Parallax').className).not.toContain('invisible');
    expect(value('Slow').className).not.toContain('invisible');
  });

  it('renders an empty panel without sections', () => {
    render(<MotionPanel sectionLabel="Empty" />);

    expect(screen.getByText('Empty')).toBeTruthy();
  });
});
