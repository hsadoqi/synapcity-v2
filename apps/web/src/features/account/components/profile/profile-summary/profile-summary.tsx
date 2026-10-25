'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@synapcity/frontend-ui/core/button';

import type { ProfileState } from '@synapcity/features-account/contracts';
import { AvatarForm } from '../../avatar';
import { ProfileAvatar } from '@synapcity/features-account/frontend';
import { NameForm } from '../../name';

type Editing = 'name' | 'avatar' | null;

/**
 * Shows the profile with an edit button for each item. Editing one item opens
 * a form with just that field, so the name and the photo save separately.
 */
export function ProfileSummary({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const [current, setCurrent] = useState({ name, imageUrl });
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
      name: state.name ?? previous.name,
      imageUrl:
        state.avatarUrl === undefined ? previous.imageUrl : state.avatarUrl,
    }));
    close();
  };

  return (
    <div className="flex flex-col gap-6">
      {editing === 'avatar' ? (
        <AvatarForm
          name={current.name}
          imageUrl={current.imageUrl}
          onSaved={saved}
          onCancel={close}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ProfileAvatar
              name={current.name}
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
          defaultName={current.name}
          onSaved={saved}
          onCancel={close}
          autoFocus
        />
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-sm font-medium">
              {current.name || 'No name yet'}
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
