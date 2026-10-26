import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LessonHighlights } from '@synapcity/frontend-ui/blocks/lesson-highlights';

const meta = {
  title: 'Blocks/LessonHighlights',
  component: LessonHighlights,
  parameters: { layout: 'centered' },
  args: {
    lesson: 'Lesson 6',
    highlights: [
      {
        text: 'useEffect runs after the DOM commit, not during render.',
        tone: 'amber',
      },
      {
        text: 'Cleanup runs before the next effect, and on unmount.',
        tone: 'sky',
      },
    ],
    note: 'Ask Priya about the stale-closure example in office hours.',
    bordered: false,
  },
} satisfies Meta<typeof LessonHighlights>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Bordered: Story = { args: { bordered: true } };

export const AllTones: Story = {
  args: {
    highlights: [
      { text: 'Amber highlight', tone: 'amber' },
      { text: 'Sky highlight', tone: 'sky' },
      { text: 'Emerald highlight', tone: 'emerald' },
      { text: 'Rose highlight', tone: 'rose' },
    ],
  },
};

export const WithoutNote: Story = { args: { note: undefined } };
