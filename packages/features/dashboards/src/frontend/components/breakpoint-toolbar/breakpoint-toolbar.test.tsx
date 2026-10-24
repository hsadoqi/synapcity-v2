import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithStore } from '../../../testing/render-with-store';
import { BreakpointToolbar } from './index';

describe('BreakpointToolbar', () => {
  it('chooses which saved layout is shown', () => {
    const { store } = renderWithStore(<BreakpointToolbar />);
    const group = screen.getByRole('group', { name: 'Layout breakpoint' });
    for (const name of ['Desktop layout', 'Tablet layout', 'Mobile layout']) {
      expect(within(group).getByRole('button', { name })).toBeDefined();
    }
    fireEvent.click(
      within(group).getByRole('button', { name: 'Mobile layout' }),
    );
    expect(store().getState().breakpoint).toBe('sm');
  });
});
