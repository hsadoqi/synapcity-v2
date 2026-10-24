import { emptyRecords } from '@synapcity/domain-prototypes';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SEED_NOW, seededWorkspace } from '../../../testing';
import { WidgetBody } from './index';

const actions = {
  toggleTask() {},
  toggleHabitDay() {},
  updateNoteBody() {},
  updateMetricValue() {},
  updateGoal() {},
  addTask() {},
};

describe('WidgetBody', () => {
  it('renders the body for the widget type', () => {
    const { composition, records } = seededWorkspace();
    const progress = composition.widgets.find((w) => w.type === 'progress')!;
    render(
      <WidgetBody
        widget={progress}
        records={records}
        now={SEED_NOW}
        actions={actions}
      />,
    );
    expect(screen.getByRole('progressbar')).toBeDefined();
  });

  it('says the record is gone when a widget points at a missing record', () => {
    const stat = seededWorkspace().composition.widgets.find(
      (w) => w.type === 'stat',
    )!;
    render(
      <WidgetBody
        widget={stat}
        records={emptyRecords()}
        now={SEED_NOW}
        actions={actions}
      />,
    );
    expect(screen.getByRole('status').textContent).toBe(
      'This metric is no longer available.',
    );
  });
});
