import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing';
import { LiveAnnouncer } from './index';

describe('LiveAnnouncer', () => {
  it('is a polite status region, empty until something is announced', () => {
    renderWithStore(<LiveAnnouncer />);
    const region = screen.getByRole('status');
    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(region.textContent).toBe('');
  });

  it('speaks a keyboard move', () => {
    const { store } = renderWithStore(<LiveAnnouncer />);
    const id = store().getState().composition.widgets[0]!.id;
    act(() =>
      store().getState().nudgeWidget(id, { dx: 0, dy: 1, dw: 0, dh: 0 }),
    );
    expect(screen.getByRole('status').textContent).toMatch(
      /moved to column \d+, row \d+/,
    );
  });
});
