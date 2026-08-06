import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTenant } from "@/lib/tenant";
import { getPostBySlug } from "@/lib/data";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const org = await getTenant();
  const post = await getPostBySlug(org.id, params.slug);
  if (!post) return {};
  return { title: post.title, description: post.excerpt ?? undefined };
}

export default async function BlogDetail({ params }: Props) {
  const org = await getTenant();
  const post = await getPostBySlug(org.id, params.slug);
  if (!post) notFound();
  return (
    <main className="page narrow">
      <Link className="back" href="/blog">← Voltar ao blog</Link>
      <p className="eyebrow">{post.author} · {new Date(post.createdAt).toLocaleDateString("pt-BR")}</p>
      <h1>{post.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.coverImage ?? ""} alt="" style={{ borderRadius: 4, margin: "2rem 0", aspectRatio: "16/9", objectFit: "cover", width: "100%" }} />
      <div className="prose">
        {post.content.split("\n\n").map((para: string, i: number) => <p key={i}>{para}</p>)}
      </div>
    </main>
  );
}
