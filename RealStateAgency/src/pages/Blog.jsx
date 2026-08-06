import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ published: true }, "-created_date").then((p) => {
      setPosts(p);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="spinner" aria-label="Carregando" />;

  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Blog</p>
        <h1>Mercado, sem <em>rodeios</em></h1>
        <p className="lead">Guias práticos e leituras de mercado escritos pela nossa equipe.</p>
      </div>

      <div className="grid-3">
        {posts.map((p) => (
          <Link className="post-card" key={p.id} to={`/blog/${p.slug}`}>
            <img src={p.cover_image} alt="" loading="lazy" />
            <div className="card-body">
              <p className="post-meta">{p.author} · {new Date(p.created_date).toLocaleDateString("pt-BR")}</p>
              <h3>{p.title}</h3>
              <p className="post-excerpt">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
