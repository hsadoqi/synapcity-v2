import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Textarea } from '@synapcity/frontend-ui/core/textarea';

describe('Textarea', () => {
  it('renders a textbox marked with its slot', () => {
    render(<Textarea aria-label="Notes" />);

    expect(
      screen.getByRole('textbox', { name: 'Notes' }).getAttribute('data-slot'),
    ).toBe('textarea');
  });

  it('reports changes', () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="Notes" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Notes'), {
      target: { value: 'hello' },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).value).toBe(
      'hello',
    );
  });

  it('is disabled when asked', () => {
    render(<Textarea aria-label="Notes" disabled />);

    expect(
      (screen.getByLabelText('Notes') as HTMLTextAreaElement).disabled,
    ).toBe(true);
  });

  it('exposes invalid state and merges a className', () => {
    render(<Textarea aria-label="Notes" aria-invalid className="h-40" />);
    const textarea = screen.getByLabelText('Notes');

    expect(textarea.getAttribute('aria-invalid')).toBe('true');
    expect(textarea.className).toContain('h-40');
  });
});
