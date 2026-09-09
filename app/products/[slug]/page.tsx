import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import AskAiButton from "@/components/AskAiButton";
import EnquiryForm from "@/components/EnquiryForm";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import ProductCard, { Stars } from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";
import SaveButton from "@/components/SaveButton";
import { getProductBySlug, getProductReviews, getRelatedProducts } from "@/lib/queries";
import { applySeoRedirect, breadcrumbLd, buildMetadata, faqLd, itemListLd, productLd, resolveAlt, resolveH1, resolveSeoContent } from "@/lib/seo";
import { SEO_HUBS } from "@/lib/seo-hubs";
import { formatINR } from "@/lib/utils";

export const revalidate = 120;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return { title: "Product not found", robots: { index: false, follow: true } };
  const path = `/products/${p.slug}`;
  const keywords = [p.primaryKeyword, p.name, p.category.name, `${p.name} price in india`, `${p.name} provider`, `${p.name} for business`, ...(p.secondaryKeywords ?? "").split(","), ...(p.keywords ?? "").split(/\s+/)]
    .filter((k): k is string => !!k)
    .map((k) => k.trim());
  return buildMetadata({
    path,
    title: p.seoTitle ?? `${p.name} in India – Pricing, Features & Verified Vendors`,
    description: p.seoDescription ?? p.shortDescription,
    keywords,
    image: p.imageUrl,
    noindex: p.noindex,
  });
}

async function Reviews({ productId }: { productId: number }) {
  const rows = await getProductReviews(productId);
  return (
    <div>
      {rows.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
      <ul className="space-y-4">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{r.authorName}</p>
              <Stars value={r.rating} />
            </div>
            {r.title && <p className="mt-1 text-sm font-medium">{r.title}</p>}
            <p className="mt-1 text-sm text-slate-600">{r.body}</p>
          </li>
        ))}
      </ul>
      <ReviewForm productId={productId} />
    </div>
  );
}

async function Related({ categoryId, id }: { categoryId: number; id: number }) {
  const rows = await getRelatedProducts(categoryId, id);
  if (!rows.length) return null;
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-xl font-bold">Similar solutions</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </section>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) {
    if (await applySeoRedirect(`/products/${slug}`)) return null;
    notFound();
  }
  // fire-and-forget view counter
  void db.update(products).set({ viewCount: sql`${products.viewCount} + 1` }).where(eq(products.id, p.id)).catch(() => {});

  const pageTitle = await resolveH1(`/products/${p.slug}`, p.seoH1 || p.name);
  const price = formatINR(p.priceFrom);
  const verified = p.vendor.status === "verified";
  const alt = await resolveAlt(`/products/${p.slug}`, p.imageAlt || `${p.name} – ${p.category.name} solution from verified vendors in India`);
  const seoContent = await resolveSeoContent(`/products/${p.slug}`);
  const related = await getRelatedProducts(p.categoryId, p.id);
  const hubs = SEO_HUBS.filter((h) => {
    const hay = `${p.name} ${p.keywords ?? ""} ${p.category.name}`.toLowerCase();
    return h.keywords.some((k) => hay.includes(k.toLowerCase())) || hay.includes(h.query.toLowerCase());
  }).slice(0, 4);

  const jsonLd = [
    productLd({
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      description: p.description,
      imageUrl: p.imageUrl,
      priceFrom: p.priceFrom,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      categoryName: p.category.name,
      vendor: { companyName: p.vendor.companyName, slug: p.vendor.slug, city: p.vendor.city, state: p.vendor.state },
    }),
    breadcrumbLd([
      { name: "Home", path: "/" },
      { name: "Marketplace", path: "/products" },
      { name: p.category.name, path: `/categories/${p.category.slug}` },
      { name: p.name, path: `/products/${p.slug}` },
    ]),
    faqLd(p.faqs),
    itemListLd(`Products similar to ${p.name}`, related.map((r) => ({ name: r.name, url: `/products/${r.slug}` }))),
  ].filter(Boolean);

  return (
    <main className="container-x py-8">
      <JsonLd data={jsonLd} />
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/products">Marketplace</Link> / <Link href={`/categories/${p.category.slug}`}>{p.category.name}</Link> / <span className="text-slate-800">{p.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/9] bg-slate-100">
              {p.imageUrl && <Image src={p.imageUrl} alt={alt} fill priority sizes="(max-width:1024px) 100vw, 66vw" className="object-cover" />}
              <div className="absolute left-3 top-3 flex gap-2">
                {p.isFeatured && <span className="badge bg-accent text-brand-dark">★ Featured</span>}
                {verified && <span className="badge bg-brand text-white">✓ Verified vendor</span>}
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={`/categories/${p.category.slug}`} className="text-xs font-semibold uppercase tracking-wide text-brand">{p.category.name}</Link>
                <SaveButton productId={p.id} variant="pill" className="px-3 py-1 text-xs" />
              </div>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">{pageTitle}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                <Stars value={p.ratingAvg} count={p.ratingCount} />
                <span className="text-slate-500">{p.viewCount.toLocaleString("en-IN")} views</span>
              </div>
              <p className="mt-4 text-slate-700">{p.shortDescription}</p>
              <div className="prose-b2b mt-4 whitespace-pre-line">{p.description}</div>
              {seoContent && <div className="prose-b2b mt-4 whitespace-pre-line border-t border-slate-100 pt-4">{seoContent}</div>}
              <div className="mt-4 flex flex-wrap gap-2">
                {p.brochureUrl && <a href={p.brochureUrl} className="btn-outline" target="_blank" rel="noopener">📄 Download brochure</a>}
                {p.videoUrl && <a href={p.videoUrl} className="btn-outline" target="_blank" rel="noopener">▶ Watch video</a>}
              </div>
            </div>
          </div>

          {p.features.length > 0 && (
            <section className="card mt-6 p-6">
              <h2 className="text-xl font-bold">Key features</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-slate-700"><span className="text-emerald-600">✔</span>{f}</li>
                ))}
              </ul>
            </section>
          )}

          {p.plans.length > 0 && (
            <section className="card mt-6 p-6" id="pricing">
              <h2 className="text-xl font-bold">Pricing &amp; plans</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {p.plans.map((pl, i) => (
                  <div key={pl.name} className={`rounded-xl border p-5 ${i === 1 ? "border-brand bg-brand/5" : "border-slate-200"}`}>
                    <p className="text-sm font-semibold uppercase text-slate-500">{pl.name}</p>
                    <p className="mt-2 text-2xl font-extrabold text-slate-900">{pl.price}</p>
                    <p className="text-xs text-slate-500">{pl.period}</p>
                    <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                      {pl.features.map((f) => <li key={f}>• {f}</li>)}
                    </ul>
                    <a href="#enquire" className={`mt-4 w-full ${i === 1 ? "btn-primary" : "btn-outline"}`}>Get this plan</a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {p.faqs.length > 0 && (
            <section className="card mt-6 p-6">
              <h2 className="text-xl font-bold">Frequently asked questions</h2>
              <div className="mt-2"><Faq items={p.faqs} /></div>
            </section>
          )}

          <section className="card mt-6 p-6">
            <h2 className="text-xl font-bold">Reviews</h2>
            <div className="mt-4">
              <Suspense fallback={<div className="space-y-3"><div className="skeleton h-16" /><div className="skeleton h-16" /></div>}>
                <Reviews productId={p.id} />
              </Suspense>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-xs text-slate-500">Starting price</p>
            <p className="text-3xl font-extrabold text-slate-900">{price ?? "Custom quote"}</p>
            {p.priceUnit && <p className="text-sm text-slate-500">{p.priceUnit}</p>}
            <a href="#enquire" className="btn-accent mt-4 w-full">Request Quote</a>
            <AskAiButton context={`Explain ${p.name} and its plans`} className="btn-outline mt-2 w-full" />
            <p className="mt-2 text-center text-xs text-slate-500">Free · No obligation · Response within 1 business day</p>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold">Vendor information</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand/10 text-xl font-bold text-brand">{p.vendor.companyName.charAt(0)}</span>
              <div>
                <Link href={`/vendors/${p.vendor.slug}`} className="font-semibold hover:text-brand">{p.vendor.companyName}</Link>
                <p className="text-xs text-slate-500">{[p.vendor.city, p.vendor.state].filter(Boolean).join(", ")}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-600">
              <li>{verified ? "✅ GST & KYC verified" : "⏳ Verification pending"}</li>
              {p.vendor.yearsInBusiness && <li>🏢 {p.vendor.yearsInBusiness}+ years in business</li>}
              <li>🇮🇳 Pan-India service</li>
            </ul>
            <p className="mt-3 text-xs text-slate-500">Contact details are shared after you submit an enquiry, to protect both parties.</p>
          </div>

          <div className="card p-5" id="enquire">
            <h2 className="text-lg font-bold">Request Quote / Contact Vendor</h2>
            <div className="mt-3"><EnquiryForm productId={p.id} productName={p.name} /></div>
          </div>
        </aside>
      </div>

      {hubs.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold">Buying guides related to {p.category.name}</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {hubs.map((h) => (
              <li key={h.slug}>
                <Link href={`/solutions/${h.slug}`} className="card block p-3 text-sm font-medium transition hover:border-accent hover:text-brand">{h.h1} →</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Suspense fallback={null}>
        <Related categoryId={p.categoryId} id={p.id} />
      </Suspense>

      <section className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Continue exploring</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/categories/${p.category.slug}`} className="badge border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand">All {p.category.name}</Link>
          <Link href={`/vendors/${p.vendor.slug}`} className="badge border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand">More from this vendor</Link>
          <Link href="/products" className="badge border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand">Full marketplace</Link>
          <Link href="/solutions" className="badge border border-slate-200 bg-white text-slate-700 hover:border-brand hover:text-brand">Buying guides</Link>
        </div>
      </section>
    </main>
  );
}
