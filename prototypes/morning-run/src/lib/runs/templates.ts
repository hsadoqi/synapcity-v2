import { randomId } from '@/lib/id';
import type { DestinationId } from './destinations';
import type { IconName, Step, StepKind } from './schema';

/** A reusable building block for the run builder. Each one makes a fresh, editable step. */
export type StepTemplate = {
  id: string;
  name: string;
  hint: string;
  icon: IconName;
  kind: StepKind;
  make: () => Step;
};

const common = (
  label: string,
  prompt: string,
  icon: IconName,
  durationSec: number,
  dest?: DestinationId[],
) => ({
  id: `s${randomId()}`,
  label,
  prompt,
  icon,
  durationSec,
  dest,
});

export const STEP_TEMPLATES: StepTemplate[] = [
  {
    id: 'energy',
    name: 'Energy check',
    hint: 'A 1 to 10 rating that paces your day',
    icon: 'zap',
    kind: 'scale',
    make: () => ({
      ...common('Energy check', 'How are you feeling right now?', 'zap', 30, [
        'Journal',
      ]),
      kind: 'scale',
      wordSet: 'energy',
      energy: true,
      notePlaceholder: 'Why? Sleep, mood, anything on your mind',
    }),
  },
  {
    id: 'rating',
    name: 'Rating',
    hint: 'Any 1 to 10 question',
    icon: 'star',
    kind: 'scale',
    make: () => ({
      ...common('How is it going?', 'Rate it from 1 to 10', 'star', 20, [
        'Journal',
      ]),
      kind: 'scale',
      wordSet: 'general',
    }),
  },
  {
    id: 'pick-one',
    name: 'Choose one',
    hint: 'A list where you pick a single answer',
    icon: 'check',
    kind: 'pick',
    make: () => ({
      ...common('Choose one', 'Pick the closest', 'check', 30, ['Notes']),
      kind: 'pick',
      options: ['Option one', 'Option two', 'Option three'],
      max: 1,
    }),
  },
  {
    id: 'pick-many',
    name: 'Choose a few',
    hint: 'A list where you pick up to three',
    icon: 'check',
    kind: 'pick',
    make: () => ({
      ...common('Choose a few', 'Pick up to three', 'check', 45, ['Notes']),
      kind: 'pick',
      options: ['Option one', 'Option two', 'Option three', 'Option four'],
      max: 3,
    }),
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    hint: 'Up to three good things',
    icon: 'heart',
    kind: 'pick',
    make: () => ({
      ...common(
        'Gratitude',
        'Name up to three things you are grateful for',
        'heart',
        60,
        ['Journal'],
      ),
      kind: 'pick',
      options: [
        'People in my life',
        'My health',
        'A good meal',
        'A quiet moment',
        'A little progress',
      ],
      max: 3,
    }),
  },
  {
    id: 'priorities',
    name: 'Top priorities',
    hint: 'Goes to your tasks',
    icon: 'flag',
    kind: 'pick',
    make: () => ({
      ...common('Top priorities', 'What matters most today?', 'flag', 60, [
        'Tasks',
      ]),
      kind: 'pick',
      options: [
        'Deep work',
        'Admin and life',
        'Move my body',
        'Call someone back',
      ],
      max: 3,
    }),
  },
  {
    id: 'focus',
    name: 'Daily focus',
    hint: 'Sets up a focus session',
    icon: 'target',
    kind: 'pick',
    make: () => ({
      ...common('Daily focus', 'What deserves your attention?', 'target', 45, [
        'Focus',
        'Schedule',
      ]),
      kind: 'pick',
      options: ['Making things', 'Learning', 'People', 'Rest'],
      max: 1,
    }),
  },
  {
    id: 'movement',
    name: 'Body and movement',
    hint: 'Health, sleep and exercise',
    icon: 'body',
    kind: 'pick',
    make: () => ({
      ...common('Movement', 'What does your body want today?', 'body', 30, [
        'Health',
      ]),
      kind: 'pick',
      options: ['A walk', 'Strength', 'Stretching', 'Rest day'],
      max: 2,
    }),
  },
  {
    id: 'reach-out',
    name: 'Reach out',
    hint: 'People you want to hear from',
    icon: 'people',
    kind: 'pick',
    make: () => ({
      ...common('Reach out', 'Who would you like to hear from?', 'people', 30, [
        'People',
      ]),
      kind: 'pick',
      options: [
        'Partner',
        'Family',
        'A close friend',
        'Someone I lost touch with',
      ],
      max: 2,
    }),
  },
  {
    id: 'breathe',
    name: 'Breathing',
    hint: 'A 4-7-8 breath, two cycles',
    icon: 'wind',
    kind: 'breathe',
    make: () => ({
      ...common('Breathing exercise', 'Follow the circle.', 'wind', 38),
      kind: 'breathe',
      optional: true,
    }),
  },
  {
    id: 'free-write',
    name: 'Free write',
    hint: 'A private page for your own words',
    icon: 'pencil',
    kind: 'text',
    make: () => ({
      ...common("What's on your mind?", 'Only you see this.', 'pencil', 120, [
        'Journal',
      ]),
      kind: 'text',
      optional: true,
      notePlaceholder: 'Start anywhere',
    }),
  },
  {
    id: 'next-step',
    name: 'Next step',
    hint: 'One small action, filed as a task',
    icon: 'target',
    kind: 'text',
    make: () => ({
      ...common(
        'Smallest next step',
        'What could you do in ten minutes?',
        'target',
        45,
        ['Tasks'],
      ),
      kind: 'text',
      optional: false,
      notePlaceholder: 'Write one action',
    }),
  },
];
