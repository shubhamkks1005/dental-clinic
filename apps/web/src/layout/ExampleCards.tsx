const cards = ["First", "Second", "Third"];

export function ExampleCards() {
  return (
    <div className="cards">
      {cards.map((name) => (
        <section key={name} className="card">
          <h2>{name} card</h2>
          <p>Example layout only. Real screens come in later tasks.</p>
        </section>
      ))}
    </div>
  );
}
