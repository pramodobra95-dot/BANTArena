import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import EnquiryForm from "@/components/EnquiryForm";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { getCategories, listProducts, type ProductCard as PC } from "@/lib/queries";
import { HUB_BY_SLUG, MARKETPLACE_NOTE, SEO_HUBS } from "@/lib/seo-hubs";
import { breadcrumbLd, buildMetadata, faqLd, itemListLd, resolveH1, serviceLd } from "@/lib/seo";
import { ensureSeeded } from "@/lib/seed";

export const revalidate = 3600;

export function generateStaticParams() {
  return SEO_HUBS.map((h) => ({ topic: h.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const hub = HUB_BY_SLUG[(await params).topic];
  if (!hub) return { title: "Solution guide not found", robots: { index: false, follow: false } };
  return buildMetadata({
    path: `/solutions/${hub.slug}`,
    title: hub.title,
    description: hub.description,
    keywords: hub.keywords,
    image: hub.categorySlug ? `/images/cat-${hub.categorySlug}.jpg` : null,
  });
}

async function HubProducts({ query, category }: { query: string; category?: string }) {
  const { items } = await listProducts({ q: query, category, limit: 6 });
  const fallback = items.length ? items : (await listProducts({ category, limit: 6 })).items;
  if (!fallback.length) return <p className="text-sm text-slate-500">Listings are being updated — post your requirement below and we will match you with verified vendors.</p>;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {fallback.map((p: PC) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}

export default async function SolutionHubPage({ params }: { params: Promise<{ topic: string }> }) {
  const hub = HUB_BY_SLUG[(await params).topic];
  if (!hub) notFound();
  await ensureSeeded();
  const path = `/solutions/${hub.slug}`;
  const [h1, cats] = await Promise.all([resolveH1(path, hub.h1), getCategories()]);
  const related = hub.related.map((s) => HUB_BY_SLUG[s]).filter(Boolean);
  const cat = hub.categorySlug ? cats.find((c) => c.slug === hub.categorySlug) : undefined;

  const ld = [
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Solution Guides", path: "/solutions" },
      { name: hub.h1, path },
    ]),
    serviceLd(hub.h1, hub.description, path),
    faqLd(hub.faqs),
    itemListLd(`${hub.h1} – related hubs`, related.map((r) => ({ name: r.h1, url: `/solutions/${r.slug}` }))),
  ].filter(Boolean);

  return (
    <main className="container-x max-w-5xl py-8">
      <JsonLd data={ld} />
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/solutions" className="hover:text-brand">Solution Guides</Link> / <span className="text-slate-800">{hub.h1}</span>
      </nav>

      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{h1}</h1>
      <p className="mt-3 text-lg text-slate-700">{hub.intro}</p>

      <aside className="mt-5 rounded-xl border-l-4 border-accent bg-accent-soft/60 p-4 text-sm text-slate-700">
        {MARKETPLACE_NOTE}
      </aside>

      <div className="prose-b2b mt-8 space-y-8">
        {hub.sections.map((s) => (
          <section key={s.h2}>
            <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{s.h2}</h2>
            <p className="mt-2 text-slate-700">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-bold md:text-2xl">Verified {hub.h1.replace(/ in India$/, "")} solutions you can request quotes for</h2>
        <p className="mt-1 text-sm text-slate-500">Live listings from GST-verified vendors on BANTConfirm.</p>
        <div className="mt-4">
          <HubProducts query={hub.query} category={hub.categorySlug} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/products?q=${encodeURIComponent(hub.query)}`} className="btn-outline">See all matching solutions</Link>
          {cat && <Link href={`/categories/${cat.slug}`} className="btn-ghost">{cat.icon} {cat.name} category</Link>}
        </div>
      </section>

      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">Frequently asked questions</h2>
        <div className="mt-2"><Faq items={hub.faqs} /></div>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold">Related guides</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/solutions/${r.slug}`} className="card block p-3 text-sm font-medium transition hover:border-accent hover:text-brand">{r.h1} →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-10 p-6" id="enquire">
        <h2 className="text-xl font-bold">Not sure which option fits? Post your requirement</h2>
        <p className="mt-1 text-sm text-slate-500">Share your need once — verified vendors respond with quotes, usually within one business day.</p>
        <div className="mt-4"><EnquiryForm productName={hub.h1} /></div>
      </section>

      <section className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Explore categories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{c.icon} {c.name}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}

export function Loading() {
  return (
    <div className="container-x max-w-5xl py-10">
      <div className="skeleton h-10 w-2/3" />
      <div className="skeleton mt-4 h-4 w-full" />
      <div className="mt-8 grid gap-5 sm:grid-cols-3">{[1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)}</div>
    </div>
  );
}
