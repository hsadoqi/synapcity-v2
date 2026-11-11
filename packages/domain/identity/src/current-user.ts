/**
 * A person as the interface shows them. `name` is the resolved presentation
 * name (see `displayNameOf`), never a value to save back as a display name.
 */
export type DisplayProfile = {
  name: string | null;
  email: string | null;
  imageUrl: string | null;
};

/**
 * The signed-in user as the UI sees it: an id plus display-only fields.
 * `displayName` is the raw display name the person set (or the provider's name
 * an OAuth sign-up prefilled), or `null`; a form that edits the display name
 * starts from it, never from the resolved `name`. `fixture` is set only by
 * development fixture mode; such a user has no session, so the browser must
 * not subscribe to auth events for it.
 */
export type CurrentUser = DisplayProfile & {
  id: string;
  displayName: string | null;
  fixture?: true;
};

export type User = Pick<DisplayProfile, 'name'> & {
  avatar?: string;
  email?: string;
};
