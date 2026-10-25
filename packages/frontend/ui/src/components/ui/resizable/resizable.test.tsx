import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@synapcity/frontend-ui/core/resizable';

// jsdom has no layout observer. Actual sizing and keyboard/pointer behavior
// are exercised with the real observer in the browser stories and web E2E.

describe('Resizable', () => {
  it('renders a labelled, keyboard-focusable separator between real panels', () => {
    render(
      <ResizablePanelGroup orientation="vertical">
        <ResizablePanel>First</ResizablePanel>
        <ResizableHandle aria-label="Resize sections" />
        <ResizablePanel>Second</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(
      screen.getByRole('separator', { name: 'Resize sections' }).tabIndex,
    ).toBe(0);
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
  });

  it('lets the inner region own scrolling instead of the library', () => {
    render(
      <ResizablePanelGroup>
        <ResizablePanel>
          <p>Content</p>
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByText('Content').parentElement?.style.overflow).toBe(
      'hidden',
    );
  });

  it('forwards consumer sizing, identity and class props', () => {
    render(
      <ResizablePanelGroup id="example" className="h-96">
        <ResizablePanel id="one" defaultSize="40%">
          One
        </ResizablePanel>
        <ResizableHandle aria-label="Resize sections" />
        <ResizablePanel id="two">Two</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(document.getElementById('example')?.classList.contains('h-96')).toBe(
      true,
    );
    expect(
      document.getElementById('one')?.getAttribute('data-panel'),
    ).not.toBeNull();
  });
});
