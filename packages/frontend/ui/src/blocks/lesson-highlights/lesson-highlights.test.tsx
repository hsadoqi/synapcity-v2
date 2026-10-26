import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LessonHighlights } from '@synapcity/frontend-ui/blocks/lesson-highlights';

describe('LessonHighlights', () => {
  it('shows the lesson, each highlight and the note', () => {
    render(
      <LessonHighlights
        lesson="Lesson 6"
        highlights={[
          { text: 'Effects run after commit.', tone: 'warning' },
          { text: 'Cleanup runs first.', tone: 'info' },
        ]}
        note="Ask in office hours."
      />,
    );

    expect(screen.getByText('Lesson 6')).toBeTruthy();
    expect(screen.getByText('Effects run after commit.')).toBeTruthy();
    expect(screen.getByText('Cleanup runs first.')).toBeTruthy();
    expect(screen.getByText('Ask in office hours.')).toBeTruthy();
  });

  it('gives each tone its own classes', () => {
    render(
      <LessonHighlights
        highlights={[
          { text: 'a', tone: 'warning' },
          { text: 'b', tone: 'info' },
          { text: 'c', tone: 'success' },
          { text: 'd', tone: 'destructive' },
        ]}
      />,
    );
    const classes = ['a', 'b', 'c', 'd'].map(
      (text) => screen.getByText(text).className,
    );

    expect(new Set(classes).size).toBe(4);
  });

  it('leaves out the lesson and note when not given', () => {
    render(
      <LessonHighlights highlights={[{ text: 'Only', tone: 'destructive' }]} />,
    );

    expect(screen.getByText('Only')).toBeTruthy();
    expect(screen.queryByText('Lesson 6')).toBeNull();
  });
});
