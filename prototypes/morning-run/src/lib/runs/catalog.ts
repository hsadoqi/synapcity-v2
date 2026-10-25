import type { DestinationId } from './destinations';
import type {
  BreatheStep,
  IconName,
  PickStep,
  Run,
  ScaleStep,
  TextStep,
} from './schema';

type Common = {
  label: string;
  prompt: string;
  durationSec: number;
  icon: IconName;
  optional?: boolean;
  notePlaceholder?: string;
  dest?: DestinationId[];
};

type StepIdFor = (n: number) => string;

const scale = (
  id: StepIdFor,
  n: number,
  c: Common & Pick<ScaleStep, 'wordSet' | 'energy'>,
): ScaleStep => ({
  ...c,
  id: id(n),
  kind: 'scale',
});

const pick = (
  id: StepIdFor,
  n: number,
  c: Common & Pick<PickStep, 'options' | 'max' | 'hours' | 'destMap'>,
): PickStep => ({ ...c, id: id(n), kind: 'pick' });

const breathe = (id: StepIdFor, n: number, c: Common): BreatheStep => ({
  ...c,
  id: id(n),
  kind: 'breathe',
  optional: true,
});

const text = (id: StepIdFor, n: number, c: Common): TextStep => ({
  ...c,
  id: id(n),
  kind: 'text',
  optional: c.optional ?? true,
});

const idFor =
  (runId: string): StepIdFor =>
  (n) =>
    `${runId}.${n}`;

const SORT_MAP: Record<string, DestinationId> = {
  Keep: 'Notes',
  Schedule: 'Schedule',
  'Make a task': 'Tasks',
  'Let go': 'Archive',
};
const SORT_OPTIONS = ['Keep', 'Schedule', 'Make a task', 'Let go'];

function sortStep(n: number, label: string): PickStep {
  return pick(idFor('inbox'), n, {
    label,
    prompt: 'What should happen to this?',
    durationSec: 20,
    options: SORT_OPTIONS,
    max: 1,
    destMap: SORT_MAP,
    notePlaceholder: 'Why?',
    icon: 'inbox',
  });
}

const run = (r: Omit<Run, 'builtIn'>): Run => ({ ...r, builtIn: true });

export const GROUPS = [
  'Daily',
  'Personal',
  'Reviews',
  'Switching',
  'Projects and meetings',
] as const;

export const BUILT_IN_RUNS: Run[] = [
  // ── Daily ─────────────────────────────────────────────────────────────
  (() => {
    const s = idFor('morning');
    return run({
      id: 'morning',
      group: 'Daily',
      name: 'Quick morning',
      tagline: 'Check in, breathe, pick your focus.',
      icon: 'sun',
      steps: [
        scale(s, 1, {
          label: 'Energy Check',
          prompt: 'How are you feeling right now?',
          wordSet: 'energy',
          energy: true,
          durationSec: 30,
          dest: ['Journal'],
          notePlaceholder: 'Why? Sleep, mood, anything on your mind',
          icon: 'zap',
        }),
        breathe(s, 2, {
          label: 'Breathing Exercise',
          prompt: 'Follow the 4-7-8 pattern. Let the circle lead.',
          durationSec: 38,
          icon: 'wind',
        }),
        pick(s, 3, {
          label: 'Gratitude',
          prompt: 'Name up to three things you are grateful for',
          max: 3,
          durationSec: 60,
          dest: ['Journal'],
          notePlaceholder: 'Anything more you want to remember',
          icon: 'heart',
          options: [
            'People in my life',
            'My health',
            'A good meal',
            'A quiet moment',
            'Something I finished',
            'A little progress',
          ],
        }),
        pick(s, 4, {
          label: 'Top 3 Priorities',
          prompt: 'What are your main priorities today?',
          max: 3,
          durationSec: 60,
          dest: ['Tasks'],
          notePlaceholder: 'Deadlines, who is waiting on it, constraints',
          icon: 'flag',
          options: [
            'Finish the draft',
            'Deep work on the main project',
            'Clear inbox and admin',
            'Move my body',
            'Plan the week',
            'Call someone back',
          ],
        }),
        pick(s, 5, {
          label: 'Set Daily Focus',
          prompt: 'Define your main focus area for today',
          max: 1,
          durationSec: 45,
          dest: ['Focus', 'Schedule'],
          notePlaceholder: 'What would make today a win?',
          icon: 'target',
          options: [
            'Making things',
            'Learning',
            'People',
            'Admin and life',
            'Rest',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('evening');
    return run({
      id: 'evening',
      group: 'Daily',
      name: 'Evening wind-down',
      tagline: 'Close the day and set up tomorrow.',
      icon: 'moon',
      steps: [
        pick(s, 1, {
          label: 'What went well?',
          prompt: 'Pick the wins, big or small',
          max: 3,
          durationSec: 45,
          dest: ['Journal'],
          notePlaceholder: 'Tell the story in a line',
          icon: 'check',
          options: [
            'Finished something',
            'Good conversation',
            'Stayed focused',
            'Took a break',
            'Helped someone',
          ],
        }),
        pick(s, 2, {
          label: 'Gratitude',
          prompt: 'One to three things from today',
          max: 3,
          durationSec: 45,
          dest: ['Journal'],
          notePlaceholder: 'Anything more',
          icon: 'heart',
          options: [
            'People in my life',
            'My health',
            'A good meal',
            'A quiet moment',
            'A little progress',
          ],
        }),
        breathe(s, 3, {
          label: 'Breathing Exercise',
          prompt: 'Slow down. Let the day go.',
          durationSec: 38,
          icon: 'wind',
        }),
        pick(s, 4, {
          label: 'Carry over',
          prompt: 'Anything unfinished to remember?',
          max: 3,
          durationSec: 45,
          dest: ['Notes'],
          notePlaceholder: 'What is it waiting on?',
          icon: 'archive',
          options: [
            'The draft',
            'An email reply',
            'A decision',
            'Nothing, all clear',
          ],
        }),
        pick(s, 5, {
          label: "Tomorrow's top three",
          prompt: 'What matters first tomorrow?',
          max: 3,
          durationSec: 60,
          dest: ['Tasks'],
          notePlaceholder: 'Anything that must happen early',
          icon: 'flag',
          options: [
            'Finish the draft',
            'Deep work on the main project',
            'Clear inbox and admin',
            'Move my body',
            'Plan the week',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('reset');
    return run({
      id: 'reset',
      group: 'Daily',
      name: 'Two-minute reset',
      tagline: 'One breath cycle and your next move.',
      icon: 'wind',
      steps: [
        breathe(s, 1, {
          label: 'Breathing Exercise',
          prompt: 'Follow the circle.',
          durationSec: 38,
          icon: 'wind',
        }),
        pick(s, 2, {
          label: "What's next?",
          prompt: 'Pick the one thing to do now',
          max: 1,
          durationSec: 30,
          dest: ['Focus'],
          notePlaceholder: 'Anything to remember while you do it',
          icon: 'target',
          options: [
            'Finish the draft',
            'Reply to messages',
            'Move my body',
            'Plan the next hour',
            'Rest',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('energy');
    return run({
      id: 'energy',
      group: 'Daily',
      name: 'Energy-matched day',
      tagline: 'Plan the day to fit how you feel.',
      icon: 'zap',
      steps: [
        scale(s, 1, {
          label: 'Energy Check',
          prompt: 'How are you feeling right now?',
          wordSet: 'energy',
          energy: true,
          durationSec: 30,
          dest: ['Journal'],
          notePlaceholder: 'Anything affecting your energy',
          icon: 'zap',
        }),
        pick(s, 2, {
          label: 'Time today',
          prompt: 'How much focused time do you have?',
          max: 1,
          hours: true,
          durationSec: 30,
          notePlaceholder: 'Meetings, deadlines, anything fixed',
          icon: 'calendar',
          options: ['1 hour', '2 hours', 'Half a day'],
        }),
        pick(s, 3, {
          label: 'What must happen?',
          prompt: 'Up to three things',
          max: 3,
          durationSec: 60,
          dest: ['Tasks', 'Focus', 'Schedule'],
          notePlaceholder: 'Why these three?',
          icon: 'flag',
          options: [
            'Finish the draft',
            'Deep work on the main project',
            'Clear inbox and admin',
            'Plan the week',
          ],
        }),
      ],
    });
  })(),

  // ── Personal: the rest of your life ───────────────────────────────────
  (() => {
    const s = idFor('body');
    return run({
      id: 'body',
      group: 'Personal',
      name: 'Body and sleep',
      tagline: 'How rested are you, and what does your body need?',
      icon: 'body',
      steps: [
        scale(s, 1, {
          label: 'How rested?',
          prompt: 'How did you sleep?',
          wordSet: 'energy',
          energy: true,
          durationSec: 20,
          dest: ['Health'],
          notePlaceholder: 'Hours, waking up, anything that helped or hurt',
          icon: 'bed',
        }),
        pick(s, 2, {
          label: 'Movement',
          prompt: 'What does your body want today?',
          max: 2,
          durationSec: 30,
          dest: ['Health', 'Schedule'],
          notePlaceholder: 'When could you do it?',
          icon: 'body',
          options: [
            'A walk',
            'Strength',
            'Stretching',
            'Something gentle',
            'Rest day',
          ],
        }),
        pick(s, 3, {
          label: 'Fuel',
          prompt: 'What would help you feel good by evening?',
          max: 3,
          durationSec: 30,
          dest: ['Health'],
          notePlaceholder: 'Anything you are avoiding or craving',
          icon: 'leaf',
          options: [
            'Water first',
            'A proper breakfast',
            'Fruit and veg',
            'Less caffeine',
            'Earlier dinner',
          ],
        }),
        text(s, 4, {
          label: 'Anything else?',
          prompt: 'Aches, symptoms, medication, or just how it feels',
          durationSec: 45,
          dest: ['Health', 'Journal'],
          notePlaceholder: 'Write what your body is telling you',
          icon: 'pencil',
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('people');
    return run({
      id: 'people',
      group: 'Personal',
      name: 'People who matter',
      tagline: 'Reach out before the week gets away.',
      icon: 'people',
      steps: [
        pick(s, 1, {
          label: 'Who comes to mind?',
          prompt: 'Who would you like to hear from today?',
          max: 2,
          durationSec: 30,
          dest: ['People'],
          notePlaceholder: 'Names, if you want them',
          icon: 'people',
          options: [
            'Partner',
            'Family',
            'A close friend',
            'Someone I lost touch with',
            'A neighbour',
          ],
        }),
        pick(s, 2, {
          label: 'A small gesture',
          prompt: 'What is the smallest kind thing you could do?',
          max: 2,
          durationSec: 30,
          dest: ['People', 'Tasks'],
          notePlaceholder: 'When will you do it?',
          icon: 'heart',
          options: [
            'Send a message',
            'Make a call',
            'Plan a meet-up',
            'Say thank you',
            'Send a photo',
          ],
        }),
        text(s, 3, {
          label: 'What to say',
          prompt: 'Draft a line you could send',
          durationSec: 60,
          dest: ['People', 'Journal'],
          notePlaceholder: 'Start with how you feel about them',
          icon: 'pencil',
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('money');
    return run({
      id: 'money',
      group: 'Personal',
      name: 'Money pulse',
      tagline: 'A calm look at what needs attention.',
      icon: 'wallet',
      steps: [
        scale(s, 1, {
          label: 'How calm?',
          prompt: 'How do you feel about money right now?',
          wordSet: 'general',
          durationSec: 20,
          dest: ['Journal'],
          notePlaceholder: 'What is behind that?',
          icon: 'wallet',
        }),
        pick(s, 2, {
          label: 'What needs a look?',
          prompt: 'Pick up to three',
          max: 3,
          durationSec: 45,
          dest: ['Money'],
          notePlaceholder: 'Amounts, dates, accounts',
          icon: 'flag',
          options: [
            'Bills due',
            'Subscriptions',
            'Savings goal',
            'A big purchase',
            'Tax and paperwork',
          ],
        }),
        pick(s, 3, {
          label: 'Next step',
          prompt: 'The smallest useful action',
          max: 1,
          durationSec: 30,
          dest: ['Tasks', 'Money'],
          notePlaceholder: 'When will you do it?',
          icon: 'target',
          options: [
            'Check the balance',
            'Cancel one thing',
            'Move money to savings',
            'Book ten minutes for it',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('home');
    return run({
      id: 'home',
      group: 'Personal',
      name: 'Home reset',
      tagline: 'Pick the corner that will make tonight easier.',
      icon: 'home',
      steps: [
        pick(s, 1, {
          label: 'Where?',
          prompt: 'Which spots are nagging at you?',
          max: 3,
          durationSec: 30,
          dest: ['Home'],
          notePlaceholder: 'Anything you need to buy or fix',
          icon: 'home',
          options: [
            'Kitchen',
            'Laundry',
            'Desk',
            'Bins and recycling',
            'Plants',
            'Bedroom',
          ],
        }),
        pick(s, 2, {
          label: 'How long?',
          prompt: 'Time-box it',
          max: 1,
          durationSec: 20,
          dest: ['Schedule'],
          notePlaceholder: 'Music? Podcast? Someone to do it with?',
          icon: 'calendar',
          options: ['10 minutes', '20 minutes', '30 minutes'],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('mind');
    return run({
      id: 'mind',
      group: 'Personal',
      name: 'Mind dump',
      tagline: 'Get it out of your head and onto the page.',
      icon: 'brain',
      steps: [
        breathe(s, 1, {
          label: 'Breathing Exercise',
          prompt: 'Settle first.',
          durationSec: 38,
          icon: 'wind',
        }),
        text(s, 2, {
          label: "What's on your mind?",
          prompt: 'Unfiltered. Nobody reads this but you.',
          durationSec: 120,
          optional: false,
          dest: ['Journal'],
          notePlaceholder: 'Start anywhere',
          icon: 'pencil',
        }),
        scale(s, 3, {
          label: 'How heavy?',
          prompt: 'How heavy does it feel now?',
          wordSet: 'general',
          durationSec: 20,
          dest: ['Journal'],
          notePlaceholder: 'What changed after writing?',
          icon: 'brain',
        }),
        pick(s, 4, {
          label: 'What would help?',
          prompt: 'Choose one',
          max: 1,
          durationSec: 30,
          dest: ['Tasks', 'Notes'],
          notePlaceholder: 'Anything to set up for it',
          icon: 'sparkles',
          options: [
            'Talk to someone',
            'Go outside',
            'Sleep on it',
            'Make a plan',
            'Nothing, it is fine',
          ],
        }),
      ],
    });
  })(),

  // ── Reviews ───────────────────────────────────────────────────────────
  (() => {
    const s = idFor('weekly');
    return run({
      id: 'weekly',
      group: 'Reviews',
      name: 'Weekly review',
      tagline: 'What moved, what carries, what is next.',
      icon: 'calendar',
      steps: [
        pick(s, 1, {
          label: 'Win of the week',
          prompt: 'What are you proud of this week?',
          max: 2,
          durationSec: 45,
          dest: ['Journal'],
          notePlaceholder: 'The story behind it',
          icon: 'check',
          options: [
            'Shipped something',
            'Learned something',
            'Kept a habit',
            'Rested well',
            'Helped someone',
          ],
        }),
        pick(s, 2, {
          label: 'How did the week feel?',
          prompt: 'One word',
          max: 1,
          durationSec: 20,
          dest: ['Journal'],
          notePlaceholder: 'Anything behind that?',
          icon: 'heart',
          options: ['Rough', 'Okay', 'Good', 'Great'],
        }),
        pick(s, 3, {
          label: 'Carry forward',
          prompt: 'What rolls into next week?',
          max: 3,
          durationSec: 45,
          dest: ['Tasks'],
          notePlaceholder: 'Why did it not get done?',
          icon: 'archive',
          options: [
            'The draft',
            'An email backlog',
            'A decision',
            'A project step',
          ],
        }),
        pick(s, 4, {
          label: 'Next week priorities',
          prompt: 'Set up to three',
          max: 3,
          durationSec: 60,
          dest: ['Tasks', 'Schedule'],
          notePlaceholder: 'Deadlines or constraints',
          icon: 'flag',
          options: [
            'Finish the draft',
            'Deep work on the main project',
            'Plan the month',
            'Move my body',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('goal');
    return run({
      id: 'goal',
      group: 'Reviews',
      name: 'Goal check',
      tagline: 'Progress, blockers, next step.',
      icon: 'flag',
      steps: [
        scale(s, 1, {
          label: 'Progress',
          prompt: 'How far along does it feel?',
          wordSet: 'general',
          durationSec: 30,
          dest: ['Journal'],
          notePlaceholder: 'What changed since last time?',
          icon: 'zap',
        }),
        pick(s, 2, {
          label: "What's in the way?",
          prompt: 'Name the blocker',
          max: 2,
          durationSec: 45,
          dest: ['Notes'],
          notePlaceholder: 'What would remove it?',
          icon: 'archive',
          options: [
            'Not enough time',
            'Unclear next step',
            'Low energy',
            'Waiting on someone',
            'Nothing, going well',
          ],
        }),
        pick(s, 3, {
          label: 'Next step',
          prompt: 'The very next action',
          max: 1,
          durationSec: 45,
          dest: ['Tasks', 'Focus'],
          notePlaceholder: 'Anything to prepare first',
          icon: 'target',
          options: [
            'Outline the plan',
            'Do a first draft',
            'Ask for help',
            'Break it into steps',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('habits');
    return run({
      id: 'habits',
      group: 'Reviews',
      name: 'Habit check-in',
      tagline: 'Tick off the day and spot patterns.',
      icon: 'flame',
      steps: [
        pick(s, 1, {
          label: 'Habits done today',
          prompt: 'Tick what you did',
          max: 5,
          durationSec: 45,
          dest: ['Habits'],
          notePlaceholder: 'Anything you want to remember',
          icon: 'flame',
          options: [
            'Move my body',
            'Read',
            'Drink water',
            'Sleep on time',
            'Meditate',
          ],
        }),
        scale(s, 2, {
          label: 'Energy Check',
          prompt: 'How do you feel after today?',
          wordSet: 'energy',
          durationSec: 30,
          dest: ['Journal'],
          notePlaceholder: 'Why?',
          icon: 'zap',
        }),
        pick(s, 3, {
          label: 'What got in the way?',
          prompt: 'For anything you skipped',
          max: 2,
          durationSec: 45,
          dest: ['Notes'],
          notePlaceholder: 'What would help tomorrow?',
          icon: 'archive',
          options: [
            'Ran out of time',
            'Forgot',
            'Low energy',
            'Nothing, did them all',
          ],
        }),
      ],
    });
  })(),

  // ── Switching ─────────────────────────────────────────────────────────
  (() => {
    const s = idFor('pickup');
    return run({
      id: 'pickup',
      group: 'Switching',
      name: 'Pick-up run',
      tagline: 'Back from a break? Find your thread.',
      icon: 'back',
      steps: [
        pick(s, 1, {
          label: 'Where were you?',
          prompt: 'What were you working on?',
          max: 1,
          durationSec: 30,
          dest: ['Notes'],
          notePlaceholder: 'Anything you remember about it',
          icon: 'back',
          options: ['The draft', 'The main project', 'Admin', 'A side project'],
        }),
        pick(s, 2, {
          label: 'What was blocking you?',
          prompt: 'If anything',
          max: 2,
          durationSec: 30,
          dest: ['Notes'],
          notePlaceholder: 'What would unblock it?',
          icon: 'archive',
          options: [
            'Unclear next step',
            'Waiting on something',
            'Lost motivation',
            'Nothing, just interrupted',
          ],
        }),
        pick(s, 3, {
          label: 'Very next step',
          prompt: 'What is the smallest move to restart?',
          max: 1,
          durationSec: 45,
          dest: ['Tasks', 'Focus'],
          notePlaceholder: 'Anything to set up first',
          icon: 'target',
          options: [
            'Re-read what I wrote',
            'Write one paragraph',
            'Reply to the open message',
            'Make a short plan',
          ],
        }),
      ],
    });
  })(),
  run({
    id: 'inbox',
    group: 'Switching',
    name: 'Inbox sweep',
    tagline: 'Triage what you captured, one item at a time.',
    icon: 'inbox',
    steps: [
      sortStep(1, 'Link: article on focus'),
      sortStep(2, 'Idea: weekly review template'),
      sortStep(3, 'Note: call the dentist'),
    ],
  }),
  (() => {
    const s = idFor('context');
    return run({
      id: 'context',
      group: 'Switching',
      name: 'Context switch',
      tagline: 'Park one thing, prime the next.',
      icon: 'swap',
      steps: [
        pick(s, 1, {
          label: 'Leave a marker',
          prompt: 'Where are you leaving off?',
          max: 1,
          durationSec: 30,
          dest: ['Notes'],
          notePlaceholder: 'The one line you will want later',
          icon: 'note',
          options: [
            'Mid-draft',
            'Waiting on feedback',
            'Blocked',
            'Done for now',
          ],
        }),
        breathe(s, 2, {
          label: 'Breathing Exercise',
          prompt: 'Clear your head before the switch.',
          durationSec: 38,
          icon: 'wind',
        }),
        pick(s, 3, {
          label: 'Switching to',
          prompt: 'What are you moving to?',
          max: 1,
          durationSec: 30,
          dest: ['Focus'],
          notePlaceholder: 'What does a good start look like?',
          icon: 'swap',
          options: ['Work project', 'Personal project', 'Admin', 'Rest'],
        }),
        pick(s, 4, {
          label: 'First move',
          prompt: 'The first thing to do there',
          max: 1,
          durationSec: 30,
          dest: ['Tasks'],
          notePlaceholder: 'Anything to prepare',
          icon: 'target',
          options: [
            'Open yesterday notes',
            'List what is left',
            'Pick one small task',
          ],
        }),
      ],
    });
  })(),

  // ── Projects and meetings ─────────────────────────────────────────────
  (() => {
    const s = idFor('project');
    return run({
      id: 'project',
      group: 'Projects and meetings',
      name: 'Start a project',
      tagline: 'From a goal to a ready workspace.',
      icon: 'plus',
      steps: [
        pick(s, 1, {
          label: "What's the goal?",
          prompt: 'Pick the closest, or add your own',
          max: 1,
          durationSec: 45,
          dest: ['Documents', 'Dashboard'],
          notePlaceholder: 'In one sentence, what is done?',
          icon: 'flag',
          options: [
            'Launch the site',
            'Write the proposal',
            'Learn a new skill',
            'Plan the trip',
          ],
        }),
        pick(s, 2, {
          label: 'When is it due?',
          prompt: 'A rough horizon is fine',
          max: 1,
          durationSec: 20,
          dest: ['Schedule'],
          notePlaceholder: 'Any hard dates?',
          icon: 'calendar',
          options: ['This week', 'This month', 'Someday'],
        }),
        pick(s, 3, {
          label: 'First steps',
          prompt: 'Up to three to get moving',
          max: 3,
          durationSec: 60,
          dest: ['Tasks'],
          notePlaceholder: 'What is the riskiest step?',
          icon: 'check',
          options: [
            'Outline it',
            'Research options',
            'Make a rough draft',
            'Ask someone for input',
          ],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('premeeting');
    return run({
      id: 'premeeting',
      group: 'Projects and meetings',
      name: 'Pre-meeting',
      tagline: 'Walk in prepared.',
      icon: 'chat',
      steps: [
        pick(s, 1, {
          label: 'Meeting goal',
          prompt: 'What do you want out of it?',
          max: 1,
          durationSec: 30,
          dest: ['Notes'],
          notePlaceholder: 'Who is attending?',
          icon: 'flag',
          options: [
            'Make a decision',
            'Share an update',
            'Get feedback',
            'Plan next steps',
          ],
        }),
        pick(s, 2, {
          label: 'Questions to ask',
          prompt: 'Up to three',
          max: 3,
          durationSec: 45,
          dest: ['Notes'],
          notePlaceholder: 'Anything you must not forget',
          icon: 'chat',
          options: [
            'What is the deadline?',
            'Who owns this?',
            'What is the budget?',
            'What is blocking us?',
          ],
        }),
        pick(s, 3, {
          label: 'Prep time',
          prompt: 'Block time before the meeting',
          max: 1,
          durationSec: 20,
          dest: ['Schedule'],
          notePlaceholder: 'Where will you prep?',
          icon: 'calendar',
          options: ['10 minutes', '20 minutes', '30 minutes'],
        }),
      ],
    });
  })(),
  (() => {
    const s = idFor('postmeeting');
    return run({
      id: 'postmeeting',
      group: 'Projects and meetings',
      name: 'Post-meeting',
      tagline: 'Decisions, follow-ups, done.',
      icon: 'chat',
      steps: [
        pick(s, 1, {
          label: 'What was decided?',
          prompt: 'Capture the outcomes',
          max: 3,
          durationSec: 45,
          dest: ['Notes'],
          notePlaceholder: 'Who agreed?',
          icon: 'check',
          options: [
            'Go ahead',
            'Needs more info',
            'Pushed to later',
            'Dropped',
          ],
        }),
        pick(s, 2, {
          label: 'Follow-ups',
          prompt: 'What do you owe?',
          max: 3,
          durationSec: 45,
          dest: ['Tasks'],
          notePlaceholder: 'Due when?',
          icon: 'flag',
          options: [
            'Send a summary',
            'Reply to a question',
            'Book the next meeting',
            'Share the notes',
          ],
        }),
        pick(s, 3, {
          label: 'Anything to schedule?',
          prompt: 'Block time for it',
          max: 1,
          durationSec: 30,
          dest: ['Schedule'],
          notePlaceholder: 'With whom?',
          icon: 'calendar',
          options: [
            'Follow-up call',
            'Working session',
            'Review',
            'Nothing to schedule',
          ],
        }),
      ],
    });
  })(),
];

export function findBuiltInRun(id: string): Run | undefined {
  return BUILT_IN_RUNS.find((r) => r.id === id);
}
