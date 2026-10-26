import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Flashcard } from '@synapcity/frontend-ui/blocks/flashcard';

describe('Flashcard', () => {
  it('shows the deck, what is due and each card with its status', () => {
    render(
      <Flashcard
        deck="Spanish vocab"
        due="12 due today"
        cards={[
          { front: 'hola', status: 'new' },
          { front: 'compartir', status: 'learning' },
          { front: 'resolver', status: 'review' },
          { front: 'bienvenida', status: 'mastered' },
        ]}
      />,
    );

    expect(screen.getByText('Spanish vocab')).toBeTruthy();
    expect(screen.getByText('12 due today')).toBeTruthy();
    for (const text of ['hola', 'New', 'Learning', 'Review', 'Mastered']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('renders an empty deck without cards', () => {
    render(<Flashcard deck="Empty" />);

    expect(screen.getByText('Empty')).toBeTruthy();
    expect(screen.queryByText('New')).toBeNull();
  });
});
