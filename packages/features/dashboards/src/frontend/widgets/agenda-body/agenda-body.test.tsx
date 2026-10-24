import { emptyRecords } from '@synapcity/domain-prototypes';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { AgendaBody } from './index';

describe('AgendaBody', () => {
  it('starts on the day of now and moves a day at a time', () => {
    render(
      <AgendaBody events={seededWorkspace().records.event} now={SEED_NOW} />,
    );
    // SEED_NOW is Friday 23 October 2026.
    expect(
      screen.getByRole('button', { name: /choose a date/i }).textContent,
    ).toContain('Fri, Oct 23');
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(
      screen.getByRole('button', { name: /choose a date/i }).textContent,
    ).toContain('Thu, Oct 22');
  });

  it("lists a day's events by time", () => {
    render(
      <AgendaBody events={seededWorkspace().records.event} now={SEED_NOW} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Previous day' }));
    expect(screen.getByText('Project review')).toBeDefined();
  });

  it('says so when nothing is scheduled', () => {
    render(<AgendaBody events={emptyRecords().event} now={SEED_NOW} />);
    expect(screen.getByText('Nothing scheduled.')).toBeDefined();
  });
});
