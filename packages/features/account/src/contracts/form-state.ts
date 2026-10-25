import type { ProfileInput } from '@synapcity/domain-identity';

/** Profile fields an error can point at, so the form can mark them invalid. */
type ProfileFieldName = keyof ProfileInput | 'avatar';

/**
 * What every profile action returns, whichever fields the form had. The name
 * and avatar forms, and the setup form that holds both, share one shape so the
 * same field components and form shell work in all of them.
 */
export type ProfileState = {
  error?: string;
  /** The fields `error` is about; absent when it concerns no one field. */
  fields?: ProfileFieldName[];
  message?: string;
  /** Echoes the field so a failed submit does not clear what was typed. */
  name?: string;
  /**
   * The picture to show now: the new one after an upload, the default after a
   * removal. Failed submits echo the previous value. A file input cannot be
   * refilled, so a failed upload just asks again.
   */
  avatarUrl?: string | null;
  /** True once the change was saved, so a caller can close an editor or move on. */
  saved?: boolean;
  /**
   * True when the error is that there is no session any more, so the form can
   * offer a way to sign in. A dropped connection is not this.
   */
  signedOut?: boolean;
};
