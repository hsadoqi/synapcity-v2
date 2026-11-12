import { cn } from '@synapcity/frontend-ui/lib/utils';

export type Tone = 'focus' | 'meeting' | 'break' | 'admin';

export interface TimeSlot {
  /** Stable identity for list keys; falls back to start, label and position. */
  id?: string;
  /** Display time, such as `09:00`. */
  start: string;
  label: string;
  tone: Tone;
}

/* Every tone reads as foreground text on a tinted fill; only the leading edge
   carries the tone's colour. `primary-foreground` and `warning-foreground` are
   the text colours for a solid fill of that colour, not for a tint, and they
   failed contrast on these backgrounds. */
export const toneClasses: Record<Tone, string> = {
  focus: 'border-l-primary bg-primary/15 text-foreground',
  meeting: 'border-l-accent bg-accent/15 text-foreground',
  break: 'border-l-muted-foreground bg-muted text-muted-foreground',
  admin: 'border-l-warning bg-warning/20 text-foreground',
};

export const AgendaTimeSlot = ({ start, label, tone }: TimeSlot) => (
  <li className="relative flex items-center gap-3">
    <span className="w-12 shrink-0 text-right text-xs tabular-nums text-current/60">
      {start}
    </span>
    <div
      className={cn(
        'flex min-h-8 flex-1 items-center rounded-md border-l-2 px-2.5 py-1',
        toneClasses[tone],
      )}
    >
      <span className="inline-flex flex-nowrap items-center text-xs font-medium">
        {label}
      </span>
    </div>
  </li>
);
