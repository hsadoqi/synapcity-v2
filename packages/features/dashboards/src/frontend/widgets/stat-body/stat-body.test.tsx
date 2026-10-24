import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { seededWorkspace } from '../../../testing/seed';
import { StatBody } from './index';

describe('StatBody', () => {
  it('shows the value, unit and comparison', () => {
    const metric = Object.values(seededWorkspace().records.metric)[0]!;
    render(<StatBody metric={metric} />);
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('sessions logged')).toBeDefined();
    expect(screen.getByText('+1 vs last week')).toBeDefined();
  });
});
