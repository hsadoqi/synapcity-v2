import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { seededWorkspace } from '../../../testing';
import { ProgressBody } from './index';

describe('ProgressBody', () => {
  it('shows progress towards the target', () => {
    const goal = Object.values(seededWorkspace().records.goal)[0]!;
    render(<ProgressBody goal={goal} />);
    expect(screen.getByText('14 of 24 books')).toBeDefined();
    const bar = screen.getByRole('progressbar', { name: 'Read 24 books' });
    expect(bar.getAttribute('aria-valuenow')).toBe('58');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });
});
