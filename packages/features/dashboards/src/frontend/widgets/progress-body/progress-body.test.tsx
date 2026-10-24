import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

  it('restores a negative draft instead of displaying an uncommitted goal', () => {
    const goal = Object.values(seededWorkspace().records.goal)[0]!;
    const onChange = vi.fn();
    render(<ProgressBody goal={goal} onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Current' });

    fireEvent.change(input, { target: { value: '-1' } });
    fireEvent.blur(input);

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveProperty('value', String(goal.current));
  });

  it('commits a non-negative target on blur', () => {
    const goal = Object.values(seededWorkspace().records.goal)[0]!;
    const onChange = vi.fn();
    render(<ProgressBody goal={goal} onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Target' });

    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith({ target: 30 });
  });
});
