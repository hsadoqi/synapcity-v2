/*
 * Facts about the site that more than one app states: its name, what it says
 * about itself, and its language. The production URL is deliberately absent;
 * it is an open decision (deployment topology, docs/architecture/decisions).
 */
export const site = {
  name: 'Synapcity',
  description: 'A connected workspace for thinking, planning, and doing.',
  locale: 'en_US',
} as const;
