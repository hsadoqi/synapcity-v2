/**
 * Moves focus to the first button of the widgets palette once it has
 * rendered (it appears with edit mode, a frame later than the click).
 */
export function focusPalette(root: ParentNode = document): void {
  requestAnimationFrame(() => {
    root
      .querySelector<HTMLElement>('[data-slot="widget-palette"] button')
      ?.focus();
  });
}

/** Moves focus to a widget's grid cell, which takes focus in edit mode. */
export function focusWidget(id: string, root: ParentNode = document): boolean {
  // Matched by dataset, not a selector, so an id never needs escaping.
  const cell = [...root.querySelectorAll<HTMLElement>('[data-widget-id]')].find(
    (candidate) => candidate.dataset.widgetId === id,
  );
  cell?.focus();
  return cell !== undefined;
}
