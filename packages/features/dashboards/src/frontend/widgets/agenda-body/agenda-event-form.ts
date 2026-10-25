import { defineForm } from '@synapcity/frontend-forms';
import { z } from 'zod';

/** The Add event form: the fields and their messages are this feature's product copy. */
export const agendaEventForm = defineForm({
  schema: z.object({
    name: z.string().min(1, 'Enter a name.'),
    date: z.string().min(1, 'Choose a date.'),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a start time.'),
  }),
  fields: [
    { type: 'text', name: 'name', label: 'Name' },
    { type: 'date', name: 'date', label: 'Date' },
    { type: 'time', name: 'time', label: 'Start time' },
  ],
});
