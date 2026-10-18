import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyNote } from '@synapcity/frontend-ui/components/empty-note';

describe('EmptyNote', () => {
  it('shows its message as a paragraph', () => {
    render(<EmptyNote>Nothing pinned yet.</EmptyNote>);

    expect(screen.getByText('Nothing pinned yet.').tagName).toBe('P');
  });
});
