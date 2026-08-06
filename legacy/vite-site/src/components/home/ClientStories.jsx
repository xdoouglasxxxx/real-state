export default function ClientStories({ testimonials = [] }) {
  return (
    <section className="section tight">
      <div className="section-head">
        <p className="eyebrow">Quem confia</p>
        <h2>Histórias de quem <em>chegou em casa</em></h2>
      </div>
      <div className="grid-3">
        {testimonials.map((t) => (
          <figure className="quote" key={t.id}>
            <blockquote>“{t.text}”</blockquote>
            <figcaption><strong>{t.author}</strong><span>{t.context}</span></figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
