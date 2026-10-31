export default function PlaygroundPage() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col gap-3">
      <p className="text-muted-foreground text-sm">Sidebar prototype</p>
      <h1 className="text-xl font-semibold">Two-level navigation</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Choose a Space in the compact rail, then choose one of its Documents or
        Dashboards in the wider panel. This playground exercises navigation
        structure only; it does not replace the application shell or open the
        selected record.
      </p>
    </section>
  );
}
