import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarShell } from '.';
import { RootSidebar } from './root-sidebar';
import { useSidebar } from '@synapcity/frontend-ui/core/sidebar';
import { ModeProvider } from '@synapcity/frontend-preferences';
import { sampleSidebarGroups } from '../../testing/sidebar-sample';

/** Every observed element's callback, so a test can report the shell's width. */
let observed: { element: Element; callback: ResizeObserverCallback }[] = [];

/** Reports a new width for the sidebar wrapper, the box the shell fits. */
const reportSize = (width: number) => {
  const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
  for (const entry of observed.filter((o) => o.element === wrapper)) {
    entry.callback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  }
};

beforeEach(() => {
  observed = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private callback: ResizeObserverCallback) {}
      observe(element: Element) {
        observed.push({ element, callback: this.callback });
      }
      unobserve() {}
      disconnect() {}
    },
  );
});

const sidebar = <RootSidebar groups={sampleSidebarGroups} />;

const renderShell = (
  header: React.ReactNode = <div>Header</div>,
  page: React.ReactNode = <p>Page</p>,
) =>
  render(
    <ModeProvider>
      <SidebarShell header={header} sidebar={sidebar}>
        {page}
      </SidebarShell>
    </ModeProvider>,
  );

const SidebarStateProbe = () => {
  const { state, open } = useSidebar();
  return <output data-testid="probe">{`${state}:${open}`}</output>;
};

describe('SidebarShell', () => {
  it('renders the header above the page inside the inset', () => {
    renderShell();
    const inset = document.querySelector('[data-slot="sidebar-inset"]')!;

    expect(inset.textContent).toContain('Header');
    expect(inset.textContent).toContain('Page');
    expect(inset.textContent!.indexOf('Header')).toBeLessThan(
      inset.textContent!.indexOf('Page'),
    );
  });

  it('renders no header when given null', () => {
    renderShell(null);

    expect(screen.queryByText('Header')).toBeNull();
    expect(screen.getByText('Page')).toBeTruthy();
  });

  it('renders the sidebar it is given, collapsed to start', () => {
    renderShell();
    const element = document.querySelector('[data-slot="sidebar"]')!;

    expect(element.getAttribute('data-state')).toBe('collapsed');
    expect(element.textContent).toContain('Training log');
  });

  it('provides sidebar context to the page, collapsed to start', () => {
    renderShell(<div>Header</div>, <SidebarStateProbe />);

    expect(screen.getByTestId('probe').textContent).toBe('collapsed:false');
  });

  it('fills its container instead of the window', () => {
    renderShell();
    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]')!;

    expect(wrapper.className).toContain('h-full');
    expect(wrapper.className).not.toContain('svh');
  });

  it('opens in a wide container and folds to icons in a narrow one', () => {
    renderShell(<div>Header</div>, <SidebarStateProbe />);
    const probe = () => screen.getByTestId('probe').textContent;

    act(() => reportSize(1280));
    expect(probe()).toBe('expanded:true');

    act(() => reportSize(600));
    expect(probe()).toBe('collapsed:false');
  });

  it("keeps the person's toggle until the container crosses the line again", () => {
    renderShell(<div>Header</div>, <SidebarStateProbe />);
    const probe = () => screen.getByTestId('probe').textContent;

    act(() => reportSize(1280));
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(probe()).toBe('collapsed:false');

    act(() => reportSize(1300));
    expect(probe()).toBe('collapsed:false');

    act(() => reportSize(700));
    act(() => reportSize(1280));
    expect(probe()).toBe('expanded:true');
  });

  it('toggles the sidebar with Ctrl+B or Cmd+B', () => {
    renderShell(<div>Header</div>, <SidebarStateProbe />);
    const probe = () => screen.getByTestId('probe').textContent;
    act(() => reportSize(1280));

    fireEvent.keyDown(window, { key: 'b' });
    expect(probe()).toBe('expanded:true');
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(probe()).toBe('collapsed:false');
    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(probe()).toBe('expanded:true');
  });

  it('leaves Ctrl+B to a control or editor that handles it first', () => {
    renderShell(
      <div>Header</div>,
      <>
        <SidebarStateProbe />
        {/* An editor's bold binding, at the element layer. */}
        <div
          data-testid="bold-owner"
          tabIndex={0}
          onKeyDown={(event) => event.preventDefault()}
        />
        <input aria-label="Notes" />
      </>,
    );
    const probe = () => screen.getByTestId('probe').textContent;
    act(() => reportSize(1280));

    for (const [target, init] of [
      [screen.getByTestId('bold-owner'), {}],
      [screen.getByRole('textbox', { name: 'Notes' }), {}],
      [window, { isComposing: true }],
      [window, { repeat: true }],
    ] as const) {
      fireEvent.keyDown(target, { key: 'b', ctrlKey: true, ...init });
      expect(probe()).toBe('expanded:true');
    }
  });

  it('lets wide content shrink instead of pushing past the viewport', () => {
    renderShell();

    expect(
      document.querySelector('[data-slot="sidebar-inset"]')!.className,
    ).toContain('min-w-0');
  });

  it('gives the panel and page separate scroll containers below the header', () => {
    renderShell();
    expect(
      document
        .querySelector('[data-slot="global-panel-scroll"]')
        ?.contains(document.querySelector('[data-slot="shell-page"]')),
    ).toBe(false);
    expect(
      document.querySelector('[data-slot="shell-page"]')?.textContent,
    ).toBe('Page');
  });
});
