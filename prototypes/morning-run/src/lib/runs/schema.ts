import { z } from 'zod';

import { destinationSchema } from './destinations';

export const ICON_NAMES = [
  'sun',
  'moon',
  'wind',
  'zap',
  'heart',
  'flag',
  'target',
  'book',
  'check',
  'calendar',
  'doc',
  'dashboard',
  'flame',
  'archive',
  'note',
  'back',
  'inbox',
  'plus',
  'swap',
  'chat',
  'brain',
  'body',
  'people',
  'wallet',
  'home',
  'bed',
  'sparkles',
  'leaf',
  'coffee',
  'pencil',
  'star',
] as const;

const iconNameSchema = z.enum(ICON_NAMES);
export type IconName = z.infer<typeof iconNameSchema>;

const WORD_SETS = ['energy', 'general'] as const;
const wordSetSchema = z.enum(WORD_SETS);
export type WordSet = z.infer<typeof wordSetSchema>;

const stepBase = {
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1).max(60),
  prompt: z.string().trim().max(140),
  /** How long the countdown for this step runs, in seconds. */
  durationSec: z.number().int().min(10).max(900),
  icon: iconNameSchema,
  /** When true Continue is always enabled; otherwise the step needs an answer. */
  optional: z.boolean().optional(),
  notePlaceholder: z.string().max(120).optional(),
  /** Areas of life this step feeds. */
  dest: z.array(destinationSchema).max(4).optional(),
};

const scaleStepSchema = z.object({
  ...stepBase,
  kind: z.literal('scale'),
  wordSet: wordSetSchema,
  /** The answer sets the pace of the schedule and focus cards. */
  energy: z.boolean().optional(),
});

const pickStepSchema = z.object({
  ...stepBase,
  kind: z.literal('pick'),
  options: z.array(z.string().trim().min(1).max(60)).min(2).max(10),
  /** 1 means choose one; anything higher means choose up to that many. */
  max: z.number().int().min(1).max(10),
  /** The chosen option is a number of focused hours. */
  hours: z.boolean().optional(),
  /** Per-option destination, for sorting steps such as the inbox sweep. */
  destMap: z.record(z.string(), destinationSchema).optional(),
});

const breatheStepSchema = z.object({
  ...stepBase,
  kind: z.literal('breathe'),
});

const textStepSchema = z.object({
  ...stepBase,
  kind: z.literal('text'),
});

const stepSchema = z.discriminatedUnion('kind', [
  scaleStepSchema,
  pickStepSchema,
  breatheStepSchema,
  textStepSchema,
]);

export type Step = z.infer<typeof stepSchema>;
export type ScaleStep = z.infer<typeof scaleStepSchema>;
export type PickStep = z.infer<typeof pickStepSchema>;
export type BreatheStep = z.infer<typeof breatheStepSchema>;
export type TextStep = z.infer<typeof textStepSchema>;
export type StepKind = Step['kind'];

export const runSchema = z.object({
  id: z.string().min(1).max(64),
  group: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(40),
  tagline: z.string().trim().max(100),
  icon: iconNameSchema,
  steps: z.array(stepSchema).min(1).max(12),
  builtIn: z.boolean(),
});

export type Run = z.infer<typeof runSchema>;
