import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Faq from "@/components/Faq";
import Filters from "@/components/Filters";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/ProductGrid";
import { getCategories, getCategoryBySlug, getCategoryVendors, getVendorCities, listProducts, type ProductListParams } from "@/lib/queries";
import { applySeoRedirect, breadcrumbLd, buildMetadata, faqLd, itemListLd, resolveH1, resolveSeoContent } from "@/lib/seo";
import { ensureSeeded } from "@/lib/seed";
import { slugify } from "@/lib/utils";

export const revalidate = 120;
type SP = Record<string, string | undefined>;

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const c = await getCategoryBySlug((await params).slug);
  if (!c) return { title: "Category not found", robots: { index: false, follow: true } };
  const sp = await searchParams;
  const filtered = !!(sp.sort || sp.verified || sp.maxPrice);
  return buildMetadata({
    path: `/categories/${c.slug}`,
    title: c.seoTitle ?? `${c.name} Solutions for Business in India – Compare Verified Vendors`,
    description: c.seoDescription ?? c.description,
    keywords: [c.name, ...(c.seoKeywords ?? "").split(","), `${c.name} providers india`, `${c.name} price`, `best ${c.name.toLowerCase()} for business`],
    image: `/images/cat-${c.slug}.jpg`,
    // filtered/sorted views are not separately indexable – canonical stays on the clean category URL
    noindex: filtered,
  });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = await getCategoryBySlug(slug);
  if (!c) {
    if (await applySeoRedirect(`/categories/${slug}`)) return null;
    notFound();
  }
  await ensureSeeded();

  const p: ProductListParams = {
    category: slug,
    sort: sp.sort as ProductListParams["sort"],
    verifiedOnly: sp.verified === "true",
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    limit: 12,
  };
  const path = `/categories/${c.slug}`;
  const [data, cats, h1, seoContent, vendors, cities] = await Promise.all([
    listProducts(p),
    getCategories(),
    resolveH1(path, c.seoH1 || `${c.name} Solutions for Business in India`),
    resolveSeoContent(path),
    getCategoryVendors(c.id, 6),
    getVendorCities(),
  ]);
  const gp: SP = { category: slug, sort: sp.sort, verified: sp.verified, maxPrice: sp.maxPrice };

  const faqs = (c.faqs?.length ? c.faqs : [
    { q: `What ${c.name.toLowerCase()} solutions are available on BANTConfirm?`, a: `Verified Indian vendors list ${c.name.toLowerCase()} products with features, plans and indicative pricing. Browse the listings below and request a quote — vendors typically respond within one business day.` },
    { q: `How do I compare ${c.name.toLowerCase()} vendors?`, a: `Use the filters to narrow by price and verified status, open individual product pages to compare features and plans, then submit one enquiry to the vendors you shortlist.` },
    { q: `Are the vendors on BANTConfirm verified?`, a: `Yes. Vendors complete GST and KYC verification before their listings go live, and every enquiry is qualified on Budget, Authority, Need and Timeline.` },
  ]);

  const ld = [
    breadcrumbLd([{ name: "Home", path: "/" }, { name: "Categories", path: "/categories" }, { name: c.name, path }]),
    itemListLd(`${c.name} solutions`, data.items.map((i) => ({ name: i.name, url: `/products/${i.slug}` }))),
    faqLd(faqs),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: c.name,
      description: c.description ?? undefined,
      url: `https://bantconfirm.com${path}`,
      isPartOf: { "@type": "WebSite", name: "BANTConfirm" },
      about: { "@type": "Thing", name: c.name },
    },
  ].filter(Boolean);

  return (
    <main className="container-x py-8">
      <JsonLd data={ld} />
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/categories" className="hover:text-brand">Categories</Link> / <span className="text-slate-800">{c.name}</span>
      </nav>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-4xl" aria-hidden>{c.icon}</span>
        <h1 className="text-3xl font-bold">{h1}</h1>
      </div>
      <p className="mt-2 max-w-3xl text-slate-600">{c.description}</p>
      {(seoContent || c.seoContent) && <div className="prose-b2b mt-4 max-w-3xl whitespace-pre-line">{seoContent ?? c.seoContent}</div>}

      <div className="mt-4 flex flex-wrap gap-2">
        {cats.filter((x) => x.slug !== slug).map((x) => (
          <Link key={x.slug} href={`/categories/${x.slug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{x.icon} {x.name}</Link>
        ))}
      </div>

      <div className="mt-5">
        <Suspense fallback={<div className="skeleton h-20" />}>
          <Filters categories={cats} hideCategory />
        </Suspense>
      </div>

      <div className="mt-6">
        <ProductGrid key={JSON.stringify(gp)} initial={data} params={gp} limit={12} emptyTitle={`No ${c.name} solutions yet`} />
      </div>

      {vendors.length > 0 && (
        <section className="mt-10 border-t border-slate-200 pt-6">
          <h2 className="text-lg font-bold">Verified {c.name} vendors</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((v) => (
              <li key={v.id}>
                <Link href={`/vendors/${v.slug}`} className="card block p-3 text-sm transition hover:border-accent">
                  <span className="font-semibold">{v.companyName}</span>
                  <span className="block text-xs text-slate-500">✓ Verified · {v.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">{c.name} – FAQs</h2>
        <div className="mt-2"><Faq items={faqs} /></div>
      </section>

      <section className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{c.name} across Indian cities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cities.slice(0, 10).map((city) => (
            <Link key={city} href={`/locations/${slugify(city)}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{c.name} in {city}</Link>
          ))}
        </div>
      </section>
    </main>
  );
}
