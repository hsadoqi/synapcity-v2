import type { DialogContainerTarget } from '@synapcity/frontend-ui/blocks/dialog-portal-container';

// The slot types live with the slot component, which renders them; re-exported
// here so the block's own type surface stays in one place.
export type {
  Tone,
  TimeSlot,
} from '@synapcity/frontend-ui/blocks/day-agenda/agenda-time-slot';

export type Surface = 'card' | 'glass';
export type DayAgendaDialogContainer =
  'card' | 'window' | DialogContainerTarget;
