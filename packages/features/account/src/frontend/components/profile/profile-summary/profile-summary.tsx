'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@synapcity/frontend-ui/components/button';
import { displayNameOf } from '@synapcity/domain-identity';

import type { ProfileAction, ProfileState } from '../../../../contracts';
import { AvatarForm } from '../../avatar';
import { ProfileAvatar } from '../../profile-avatar';
import { NameForm } from '../../name';

type Editing = 'name' | 'avatar' | null;

type Names = { firstName: string; lastName: string; displayName: string };

/**
 * Shows the profile with an edit button for each item. Editing one item opens
 * a form with just that item, so the names and the photo save separately. The
 * name shown is the display name, else the first name.
 */
export function ProfileSummary({
  names,
  imageUrl,
  actions,
  signInHref,
}: {
  /** The stored names; empty strings where there is none. */
  names: Names;
  imageUrl: string | null;
  /** The save actions the host supplies for the two forms. */
  actions: { updateName: ProfileAction; updateAvatar: ProfileAction };
  signInHref: (returnTo: string) => string;
}) {
  const [current, setCurrent] = useState({ ...names, imageUrl });
  const shownName =
    displayNameOf({
      displayName: current.displayName,
      firstName: current.firstName,
    }) ?? '';
  const [editing, setEditing] = useState<Editing>(null);
  const nameButton = useRef<HTMLButtonElement>(null);
  const avatarButton = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<Editing>(null);

  // Closing an editor puts focus back on the button that opened it.
  useEffect(() => {
    if (editing !== null || !returnTo.current) return;
    const button = returnTo.current === 'name' ? nameButton : avatarButton;
    button.current?.focus();
    returnTo.current = null;
  }, [editing]);

  const open = (item: Exclude<Editing, null>) => {
    setEditing(item);
  };
  const close = () => {
    returnTo.current = editing;
    setEditing(null);
  };

  const saved = (state: ProfileState) => {
    setCurrent((previous) => ({
      firstName: state.firstName ?? previous.firstName,
      lastName: state.lastName ?? previous.lastName,
      displayName: state.name ?? previous.displayName,
      imageUrl:
        state.avatarUrl === undefined ? previous.imageUrl : state.avatarUrl,
    }));
    close();
  };

  return (
    <div className="flex flex-col gap-6">
      {editing === 'avatar' ? (
        <AvatarForm
          action={actions.updateAvatar}
          signInHref={signInHref}
          name={shownName}
          imageUrl={current.imageUrl}
          onSaved={saved}
          onCancel={close}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={shownName}
              imageUrl={current.imageUrl}
              size="lg"
              className="size-16"
            />
            <span className="text-sm font-medium">Photo</span>
          </div>
          <Button
            ref={avatarButton}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => open('avatar')}
          >
            Edit photo
          </Button>
        </div>
      )}

      {editing === 'name' ? (
        <NameForm
          action={actions.updateName}
          signInHref={signInHref}
          defaultFirstName={current.firstName}
          defaultLastName={current.lastName}
          defaultName={current.displayName}
          onSaved={saved}
          onCancel={close}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-sm font-medium">
              {shownName || 'No name yet'}
            </span>
          </div>
          <Button
            ref={nameButton}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => open('name')}
          >
            Edit name
          </Button>
        </div>
      )}
    </div>
  );
}
