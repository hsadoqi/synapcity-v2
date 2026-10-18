/**
 * Wraps every /home route. It grows with its content and the page scrolls as
 * usual; nothing on home needs to stay fixed while the rest scrolls (settings
 * does, so it uses data-fill-viewport instead).
 *
 * A div, not <main>: the root shell already renders the page's one main
 * landmark around it.
 */
export function HomeShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
