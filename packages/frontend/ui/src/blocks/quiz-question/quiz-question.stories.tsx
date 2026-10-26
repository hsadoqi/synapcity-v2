import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { QuizQuestion } from '@synapcity/frontend-ui/blocks/quiz-question';

const meta = {
  title: 'Blocks/QuizQuestion',
  component: QuizQuestion,
  parameters: { layout: 'centered' },
  args: {
    questionIndex: 3,
    totalQuestions: 10,
    question: 'Which hook schedules an effect after the DOM is painted?',
    options: [
      { letter: 'A', label: 'useLayoutEffect', state: 'idle' },
      { letter: 'B', label: 'useEffect', state: 'selected' },
      { letter: 'C', label: 'useMemo', state: 'idle' },
      { letter: 'D', label: 'useDeferredValue', state: 'idle' },
    ],
    bordered: false,
  },
} satisfies Meta<typeof QuizQuestion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bordered: Story = { args: { bordered: true } };

export const Answered: Story = {
  args: {
    options: [
      { letter: 'A', label: 'useLayoutEffect', state: 'incorrect' },
      { letter: 'B', label: 'useEffect', state: 'correct' },
      { letter: 'C', label: 'useMemo', state: 'idle' },
      { letter: 'D', label: 'useDeferredValue', state: 'idle' },
    ],
  },
};
