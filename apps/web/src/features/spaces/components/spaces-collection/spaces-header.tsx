/** The spaces page's heading and intro; shared with its skeleton so loading never changes the words. */
export function SpacesHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
        Spaces
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground text-pretty">
        Each space keeps related documents and dashboards in one place. The one
        you changed last comes first.
      </p>
    </header>
  );
}
