import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.BlogPost.filter({ slug }).then((rows) => {
      setPost(rows[0] ?? null);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <div className="spinner" aria-label="Carregando" />;

  if (!post) {
    return (
      <main className="page narrow center-page">
        <p className="eyebrow">Post não encontrado</p>
        <h1>Este artigo não <em>existe</em></h1>
        <Link className="btn-solid inline-btn" to="/blog">Voltar ao blog</Link>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <Link className="back" to="/blog">← Voltar ao blog</Link>
      <p className="eyebrow">{post.author} · {new Date(post.created_date).toLocaleDateString("pt-BR")}</p>
      <h1>{post.title}</h1>
      <img
        src={post.cover_image}
        alt=""
        style={{ borderRadius: 4, margin: "2rem 0", aspectRatio: "16/9", objectFit: "cover", width: "100%" }}
      />
      <div className="prose">
        {post.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
      </div>
    </main>
  );
}
