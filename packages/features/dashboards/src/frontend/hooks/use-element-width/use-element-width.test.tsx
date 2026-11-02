import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useElementWidth } from './use-element-width';

/** Every live observer, so a test can report a size the way the browser does. */
let observers: {
  callback: ResizeObserverCallback;
  elements: Set<Element>;
  disconnected: boolean;
}[] = [];

beforeEach(() => {
  observers = [];
  vi.stubGlobal(
    'ResizeObserver',
    class {
      entry: (typeof observers)[number];
      constructor(callback: ResizeObserverCallback) {
        this.entry = { callback, elements: new Set(), disconnected: false };
        observers.push(this.entry);
      }
      observe(element: Element) {
        this.entry.elements.add(element);
      }
      unobserve(element: Element) {
        this.entry.elements.delete(element);
      }
      disconnect() {
        this.entry.elements.clear();
        this.entry.disconnected = true;
      }
    },
  );
});

afterEach(() => vi.unstubAllGlobals());

const watching = () =>
  observers.filter((o) => !o.disconnected).flatMap((o) => [...o.elements]);

function resize(element: Element, width: number) {
  act(() => {
    for (const observer of observers) {
      if (observer.elements.has(element))
        observer.callback(
          [{ target: element, contentRect: { width } } as ResizeObserverEntry],
          {} as ResizeObserver,
        );
    }
  });
}

function Probe({ show = true, on = 'a' }: { show?: boolean; on?: 'a' | 'b' }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  return (
    <>
      <output>{width ?? 'unmeasured'}</output>
      {show && on === 'a' && <div data-testid="a" ref={ref} />}
      {show && on === 'b' && <div data-testid="b" ref={ref} />}
    </>
  );
}

const reported = () => screen.getByRole('status').textContent;

describe('useElementWidth', () => {
  it('reports the width of an element present on first render', () => {
    render(<Probe />);
    expect(reported()).toBe('unmeasured');
    resize(screen.getByTestId('a'), 640);
    expect(reported()).toBe('640');
  });

  it('observes an element that mounts after the first render', () => {
    const view = render(<Probe show={false} />);
    expect(watching()).toEqual([]);
    view.rerender(<Probe show />);
    const element = screen.getByTestId('a');
    expect(watching()).toEqual([element]);
    resize(element, 480);
    expect(reported()).toBe('480');
  });

  it('follows the ref to a different element and drops the old one', () => {
    const view = render(<Probe on="a" />);
    expect(watching()).toEqual([screen.getByTestId('a')]);
    view.rerender(<Probe on="b" />);
    const second = screen.getByTestId('b');
    expect(watching()).toEqual([second]);
    resize(second, 320);
    expect(reported()).toBe('320');
  });

  it('stops observing when the element or the component goes away', () => {
    const view = render(<Probe />);
    view.rerender(<Probe show={false} />);
    expect(watching()).toEqual([]);
    view.rerender(<Probe />);
    view.unmount();
    expect(watching()).toEqual([]);
  });

  it('keeps one observer while the same element stays mounted', () => {
    const view = render(<Probe />);
    view.rerender(<Probe />);
    view.rerender(<Probe />);
    expect(observers.filter((o) => !o.disconnected)).toHaveLength(1);
  });
});
