export const VIEWS = ['focus', 'stage', 'workbench'] as const;
export type View = (typeof VIEWS)[number];

export const VIEW_COOKIE = 'mr-view';

export const VIEW_META: Record<
  View,
  { label: string; description: string; tone: 'dark' | 'light' }
> = {
  focus: {
    label: 'Focus',
    description: 'Near-black and amber. One thing at a time.',
    tone: 'dark',
  },
  stage: {
    label: 'Stage',
    description: 'Teal on navy. Cards and icons.',
    tone: 'dark',
  },
  workbench: {
    label: 'Workbench',
    description: 'Light, with steps and a live preview.',
    tone: 'light',
  },
};

export function parseView(value: string | undefined): View {
  return VIEWS.find((v) => v === value) ?? 'focus';
}
