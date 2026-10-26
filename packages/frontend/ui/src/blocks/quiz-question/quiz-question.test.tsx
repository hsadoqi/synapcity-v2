import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { QuizQuestion } from '@synapcity/frontend-ui/blocks/quiz-question';

const options = [
  { letter: 'A', label: 'useLayoutEffect', state: 'incorrect' as const },
  { letter: 'B', label: 'useEffect', state: 'correct' as const },
  { letter: 'C', label: 'useMemo', state: 'selected' as const },
  { letter: 'D', label: 'useDeferredValue' },
];

describe('QuizQuestion', () => {
  it('shows the progress, the question and each option as a button', () => {
    render(
      <QuizQuestion
        questionIndex={3}
        totalQuestions={10}
        question="Which hook runs after paint?"
        options={options}
      />,
    );

    expect(screen.getByText('Question 3 of 10')).toBeTruthy();
    expect(screen.getByText('Which hook runs after paint?')).toBeTruthy();
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'B useEffect' })).toBeTruthy();
  });

  it('styles each answer state differently, idle by default', () => {
    render(<QuizQuestion options={options} />);
    const classes = screen
      .getAllByRole('button')
      .map((button) => button.className);

    expect(new Set(classes).size).toBe(4);
  });

  it('starts at question 1 of 1', () => {
    render(<QuizQuestion />);

    expect(screen.getByText('Question 1 of 1')).toBeTruthy();
  });
});
