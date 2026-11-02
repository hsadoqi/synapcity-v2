/**
 * How long a panel glides open or closed, in milliseconds. It is a CSS
 * transition on the panel's flex-grow, switched on only around a button, Escape
 * or outside-click toggle: a drag must follow the pointer, so it never animates.
 */
export const GLIDE_MS = 200;
