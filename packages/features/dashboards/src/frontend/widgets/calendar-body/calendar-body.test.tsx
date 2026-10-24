import { emptyRecords } from '@synapcity/domain-prototypes';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SEED_NOW, seededWorkspace } from '../../../testing/seed';
import { CalendarBody } from './index';

describe('CalendarBody', () => {
  it("lists this week's events, earliest first, with their weekday", () => {
    const { container } = render(
      <CalendarBody events={seededWorkspace().records.event} now={SEED_NOW} />,
    );
    const names = [...container.querySelectorAll('li')].map(
      (li) => li.textContent,
    );
    expect(names[0]).toContain('Mon');
    expect(names[0]).toContain('Morning run');
    expect(names.at(-1)).toContain('Meal prep');
    expect(container.querySelectorAll('time[datetime]')).toHaveLength(4);
  });

  it('says so when nothing is scheduled', () => {
    render(<CalendarBody events={emptyRecords().event} now={SEED_NOW} />);
    expect(screen.getByText('Nothing scheduled this week.')).toBeDefined();
  });
});
