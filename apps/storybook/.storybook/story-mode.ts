import type { SyntheticEvent } from 'react';

/*
 * A "Toggle mode" action in the toolbar under each docs-page story (next to Show code and Copy
 * code), registered through `parameters.docs.canvas.additionalActions`. It overrides the mode for
 * that one story by putting `.light` or `.dark` (the classes the app and the toolbar switcher
 * use) on the story's preview element. Clicking back to the page's own mode removes the override.
 *
 * The action gets no state from Storybook, so it works on the DOM: it finds its own preview from
 * the clicked button.
 *
 * Limit: the `dark:` variant matches any `.dark` ancestor, so a light story under a dark page
 * still receives `dark:` utilities. Colours that come from tokens are unaffected.
 */
export const storyModeAction = {
  title: 'Toggle mode',
  onClick: (event?: SyntheticEvent) => {
    const story = (event?.target as HTMLElement)?.parentElement?.parentElement?.previousElementSibling?.querySelector('.docs-story')
    if (!story) return;


    const pageMode = story.classList.contains('dark')
      ? 'dark'
      : 'light';
    const current = story.classList.contains('dark')
      ? 'dark'
      : story.classList.contains('light')
        ? 'light'
        : pageMode;
    const next = current === 'dark' ? 'light' : 'dark';
    story.classList.remove('light', 'dark');
    console.log("page", pageMode, "current", current, "next", next, "story", story);
    if (next !== pageMode) story.classList.add(next);
  },
};
