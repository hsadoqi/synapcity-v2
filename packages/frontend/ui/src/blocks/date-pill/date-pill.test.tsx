import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DatePill } from '@synapcity/frontend-ui/blocks/date-pill';
import { surfaceClasses } from '@synapcity/frontend-ui/lib/surface';

const pill = (container: HTMLElement) =>
  container.firstElementChild!.firstElementChild!;

describe('DatePill', () => {
  it('shows each part it is given', () => {
    render(
      <DatePill relative="Today" weekday="Thu" date="Apr 23" time="14:00" />,
    );

    for (const text of ['Today', 'Thu', 'Apr 23', '14:00']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('leaves out the parts it is not given', () => {
    render(<DatePill date="Apr 23" />);

    expect(screen.getByText('Apr 23')).toBeTruthy();
    expect(screen.queryByText('Today')).toBeNull();
  });

  it('takes its colours from the surface and can be bordered', () => {
    const { container, rerender } = render(<DatePill date="Apr 23" />);
    expect(pill(container).className).toContain(surfaceClasses.card.plain);

    rerender(<DatePill date="Apr 23" surface="glass" inverted bordered />);
    expect(pill(container).className).toContain(surfaceClasses.glass.inverted);
    expect(pill(container).className).toContain('border');
  });
});
