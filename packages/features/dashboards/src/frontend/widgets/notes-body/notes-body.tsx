import type { Note } from '@synapcity/domain-prototypes';

export function NotesBody({
  note,
  label,
  onChange,
}: {
  note: Note;
  label: string;
  onChange: (body: string) => void;
}) {
  return (
    <textarea
      aria-label={label}
      value={note.body}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Write something…"
      className="size-full min-h-24 resize-none border-0 bg-transparent p-0 text-sm text-foreground outline-none placeholder:text-muted-foreground"
    />
  );
}
