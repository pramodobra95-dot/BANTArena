import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import { getBlogRelatedProducts, getCategories } from "@/lib/queries";
import { applySeoRedirect, articleLd, breadcrumbLd, buildMetadata, faqLd } from "@/lib/seo";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await db.query.blogs.findFirst({ where: eq(blogs.slug, (await params).slug) });
  if (!b) return { title: "Article not found", robots: { index: false, follow: true } };
  return buildMetadata({
    path: `/blog/${b.slug}`,
    title: b.title,
    description: b.excerpt,
    keywords: [b.title, ...(b.seoKeywords ?? "").split(",")],
    image: b.coverUrl,
    type: "article",
    publishedTime: new Date(b.createdAt).toISOString(),
    noindex: !b.isPublished,
  });
}
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const b = await db.query.blogs.findFirst({ where: and(eq(blogs.slug, (await params).slug), eq(blogs.isPublished, true)) });
  if (!b) {
    if (await applySeoRedirect(`/blog/${(await params).slug}`)) return null;
    notFound();
  }
  const related = await getBlogRelatedProducts(`${b.title} ${b.excerpt ?? ""} ${b.content} ${b.seoKeywords ?? ""}`, 3);
  const cats = await getCategories();
  return (
    <main className="container-x max-w-3xl py-8">
      <JsonLd
        data={[
          articleLd({ title: b.title, slug: b.slug, excerpt: b.excerpt, coverUrl: b.coverUrl, createdAt: b.createdAt }),
          breadcrumbLd([{ name: "Home", path: "/" }, { name: "Insights", path: "/blog" }, { name: b.title, path: `/blog/${b.slug}` }]),
        ]}
      />
      <nav className="mb-3 text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/blog" className="hover:text-brand">Insights</Link> / <span className="text-slate-800">{b.title}</span>
      </nav>
      <article className="card overflow-hidden">
        {b.coverUrl && <div className="relative aspect-[21/9]"><Image src={b.coverUrl} alt={b.title} fill priority sizes="800px" className="object-cover" /></div>}
        <div className="p-6 md:p-10">
          <p className="text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
          <h1 className="mt-2 text-3xl font-bold">{b.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{b.excerpt}</p>
          <div className="prose-b2b mt-6 whitespace-pre-line">{b.content}</div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-bold">Solutions mentioned in this guide</h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 border-t border-slate-200 pt-5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Explore categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{c.icon} {c.name}</Link>)}
        </div>
      </section>
    </main>
  );
}
