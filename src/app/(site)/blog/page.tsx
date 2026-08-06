import type { Metadata } from "next";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getBlogPosts } from "@/lib/data";

export const metadata: Metadata = { title: "Blog" };

export default async function Blog() {
  const org = await getTenant();
  const posts = await getBlogPosts(org.id);
  return (
    <main className="page">
      <div className="page-head">
        <p className="eyebrow">Blog</p>
        <h1>Mercado, sem <em>rodeios</em></h1>
        <p className="lead">Guias práticos e leituras de mercado escritos pela nossa equipe.</p>
      </div>
      <div className="grid-3">
        {posts.map((p: any) => (
          <Link className="post-card" key={p.id} href={`/blog/${p.slug}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.coverImage} alt="" loading="lazy" />
            <div className="card-body">
              <p className="post-meta">{p.author} · {new Date(p.createdAt).toLocaleDateString("pt-BR")}</p>
              <h3>{p.title}</h3>
              <p className="post-excerpt">{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
