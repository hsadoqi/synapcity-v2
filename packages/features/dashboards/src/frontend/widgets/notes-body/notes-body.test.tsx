import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { seededWorkspace } from '../../../testing';
import { NotesBody } from './index';

describe('NotesBody', () => {
  it('edits the note body', () => {
    const note = Object.values(seededWorkspace().records.note).find(
      (n) => n.name === 'Ideas',
    )!;
    const onChange = vi.fn();
    render(<NotesBody note={note} label="Ideas" onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: 'Ideas' });
    expect((field as HTMLTextAreaElement).value).toContain('Vision board');
    fireEvent.change(field, { target: { value: 'New idea' } });
    expect(onChange).toHaveBeenCalledWith('New idea');
  });
});
