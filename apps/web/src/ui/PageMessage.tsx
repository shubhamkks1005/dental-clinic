export function PageMessage({ title, text }: { title: string; text: string }) {
  return (
    <section className="card page-message">
      <h1>{title}</h1>
      <p className="muted">{text}</p>
    </section>
  );
}

export function NotFound() {
  return (
    <PageMessage
      title="Page not found"
      text="This page does not exist. Check the address and try again."
    />
  );
}

export function NotBuiltYet() {
  return (
    <PageMessage title="Not ready yet" text="This screen is not built yet. Use Today for now." />
  );
}
