import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, vendors } from "@/db/schema";
import EnquiryForm from "@/components/EnquiryForm";
import JsonLd from "@/components/JsonLd";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as PC } from "@/lib/queries";
import { applySeoRedirect, breadcrumbLd, buildMetadata, itemListLd, resolveH1, vendorLd } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const v = await db.query.vendors.findFirst({ where: eq(vendors.slug, (await params).slug) });
  if (!v) return { title: "Vendor not found", robots: { index: false, follow: true } };
  const place = [v.city, v.state].filter(Boolean).join(", ");
  return buildMetadata({
    path: `/vendors/${v.slug}`,
    title: v.seoTitle ?? `${v.companyName} – Products, Services & Contact${place ? ` in ${place}` : ""} | Verified Vendor`,
    description: v.seoDescription ?? v.description ?? `${v.companyName} is a verified vendor on BANTConfirm. Compare their products, plans and pricing, then request a quote.`,
    keywords: [v.companyName, `${v.companyName} products`, `${v.companyName} services`, ...(v.seoKeywords ?? "").split(","), ...(place ? [`${v.companyName} ${v.city}`, v.city ?? ""] : [])],
    image: v.logoUrl,
    noindex: v.status === "rejected" || v.status === "suspended",
  });
}

export default async function VendorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const v = await db.query.vendors.findFirst({ where: eq(vendors.slug, slug) });
  if (!v || v.status === "rejected") {
    if (await applySeoRedirect(`/vendors/${slug}`)) return null;
    notFound();
  }
  const path = `/vendors/${v.slug}`;
  const h1 = await resolveH1(path, v.companyName);

  const rows = (await db
    .select({
      id: products.id, name: products.name, slug: products.slug, shortDescription: products.shortDescription, imageUrl: products.imageUrl,
      priceFrom: products.priceFrom, priceUnit: products.priceUnit, ratingAvg: products.ratingAvg, ratingCount: products.ratingCount,
      isFeatured: products.isFeatured, categoryName: categories.name, categorySlug: categories.slug,
      vendorVerified: sql<boolean>`${v.status} = 'verified'`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.vendorId, v.id), eq(products.status, "approved")))) as PC[];

  const catsUsed = Array.from(new Map(rows.map((r) => [r.categorySlug, r.categoryName])).entries());
  const place = [v.city, v.state].filter(Boolean).join(", ");

  const ld = [
    vendorLd({
      companyName: v.companyName, slug: v.slug, description: v.description, city: v.city, state: v.state,
      website: v.website, yearsInBusiness: v.yearsInBusiness, serviceAreas: v.serviceAreas ?? [],
      products: rows.map((r) => ({ name: r.name, slug: r.slug })),
    }),
    breadcrumbLd([{ name: "Home", path: "/" }, { name: "Vendors", path: "/vendors" }, { name: v.companyName, path }]),
    itemListLd(`Products by ${v.companyName}`, rows.map((r) => ({ name: r.name, url: `/products/${r.slug}` }))),
  ].filter(Boolean);

  return (
    <main className="container-x py-8">
      <JsonLd data={ld} />
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/vendors" className="hover:text-brand">Vendors</Link> / <span className="text-slate-800">{v.companyName}</span>
      </nav>
      <div className="card mt-3 flex flex-col gap-5 p-6 md:flex-row md:items-center">
        <span className="grid h-20 w-20 place-items-center rounded-xl bg-brand/10 text-3xl font-bold text-brand" aria-hidden>{v.companyName.charAt(0)}</span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{h1}</h1>
          <p className="text-sm text-slate-500">{place}{v.yearsInBusiness ? ` · ${v.yearsInBusiness}+ years in business` : ""}</p>
          <p className="mt-2 text-slate-700">{v.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {v.status === "verified" ? <span className="badge bg-brand text-white">✓ GST &amp; KYC verified</span> : <span className="badge bg-amber-100 text-amber-800">Verification pending</span>}
            {v.website && <a href={v.website} className="badge bg-slate-100 transition hover:bg-accent/30" target="_blank" rel="noopener nofollow">🌐 Website</a>}
            {(v.serviceAreas ?? []).slice(0, 4).map((a) => <span key={a} className="badge bg-slate-100">📍 {a}</span>)}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">Solutions by {v.companyName} ({rows.length})</h2>
          {rows.length === 0 ? (
            <div className="card p-10 text-center text-slate-500">No approved solutions yet.</div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">{rows.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}

          {catsUsed.length > 0 && (
            <div className="mt-8 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Service categories offered</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {catsUsed.map(([cslug, cname]) => (
                  <Link key={cslug} href={`/categories/${cslug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{cname}</Link>
                ))}
              </div>
            </div>
          )}

          {v.city && (
            <div className="mt-6 border-t border-slate-200 pt-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Location</h2>
              <p className="mt-2 text-sm text-slate-600">
                Based in {place}. <Link href={`/locations/${v.city.toLowerCase().replace(/\s+/g, "-")}`} className="font-semibold text-brand hover:underline">See more technology vendors in {v.city} →</Link>
              </p>
            </div>
          )}
        </section>

        <aside className="card h-fit p-5">
          <h2 className="text-lg font-bold">Contact this vendor</h2>
          <p className="mt-1 text-xs text-slate-500">Share your requirement — contact details are exchanged after you submit the enquiry.</p>
          <div className="mt-3"><EnquiryForm productId={rows[0]?.id} /></div>
        </aside>
      </div>
    </main>
  );
}
