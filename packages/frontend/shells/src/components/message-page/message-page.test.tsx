import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MESSAGE_HEADING_ID, MessagePage } from '.';

describe('MessagePage', () => {
  it('has one h1 with the title, the description and the ways forward', () => {
    render(
      <MessagePage title="Oops" description="Something happened.">
        <button type="button">Do the thing</button>
      </MessagePage>,
    );

    const heading = screen.getByRole('heading', { level: 1, name: 'Oops' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText('Something happened.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Do the thing' })).toBeTruthy();
    expect(heading.id).toBe(MESSAGE_HEADING_ID);
  });

  it('lets the heading take focus without joining the tab order', () => {
    render(
      <MessagePage title="Oops" description="x">
        <span />
      </MessagePage>,
    );

    const heading = screen.getByRole('heading', { name: 'Oops' });
    expect(heading.getAttribute('tabindex')).toBe('-1');
    heading.focus();
    expect(document.activeElement).toBe(heading);
  });
});
