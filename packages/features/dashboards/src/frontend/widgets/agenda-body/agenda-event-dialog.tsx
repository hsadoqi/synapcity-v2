'use client';

import { localStartsAt } from '@synapcity/domain-prototypes';
import { FormDialog as EntityFormDialog } from '@synapcity/frontend-forms';

import { agendaEventForm } from './agenda-event-form';

/** The start time offered until the user picks one. */
const DEFAULT_START = '09:00';

/**
 * Adds an event: `EntityFormDialog` around the Add event form. The day it
 * opens on is the one the agenda shows. A date and time that do not make a
 * real moment fail the save, which the form reports without the error's text.
 */
export function AgendaEventDialog({
  open,
  onOpenChange,
  day,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The day to start on, `yyyy-MM-dd`. */
  day: string;
  onAdd: (name: string, startsAt: string) => void;
}) {
  return (
    <EntityFormDialog
      mode="create"
      entityName="event"
      submitLabel="Add event"
      open={open}
      onOpenChange={onOpenChange}
      definition={agendaEventForm}
      initialValues={{ name: '', date: day, time: DEFAULT_START }}
      onSubmit={({
        name,
        date,
        time,
      }: {
        name?: string;
        date?: string;
        time?: string;
      }) => {
        const startsAt = localStartsAt(date ?? '', time ?? '');
        if (!name || !startsAt) throw new Error('Not a real event');
        onAdd(name, startsAt);
      }}
    />
  );
}
