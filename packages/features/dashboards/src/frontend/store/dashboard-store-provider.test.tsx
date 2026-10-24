import { createComposition } from '@synapcity/domain-dashboards';
import { emptyRecords } from '@synapcity/domain-prototypes';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  DashboardStoreProvider,
  useDashboardStore,
  type DashboardStoreInit,
} from './index';

const init: DashboardStoreInit = {
  composition: createComposition(),
  records: emptyRecords(),
  ownerId: '11111111-1111-4111-8111-111111111111',
  breakpoint: 'md',
};

function Breakpoint() {
  return <p>{useDashboardStore((s) => s.breakpoint)}</p>;
}

describe('DashboardStoreProvider', () => {
  it('refuses to read the store outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Breakpoint />)).toThrow(
      'useDashboardStore must be used within DashboardStoreProvider',
    );
  });

  it('serves the store to its children', () => {
    render(
      <DashboardStoreProvider init={init}>
        <Breakpoint />
      </DashboardStoreProvider>,
    );
    expect(screen.getByText('md')).toBeDefined();
  });

  it('hands the store to onStore once across re-renders', () => {
    const onStore = vi.fn();
    const { rerender } = render(
      <DashboardStoreProvider init={init} onStore={onStore}>
        <Breakpoint />
      </DashboardStoreProvider>,
    );
    rerender(
      <DashboardStoreProvider init={init} onStore={onStore}>
        <Breakpoint />
      </DashboardStoreProvider>,
    );
    expect(onStore).toHaveBeenCalledTimes(1);
  });
});
