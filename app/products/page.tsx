import type { Metadata } from "next";
import { Suspense } from "react";
import Filters from "@/components/Filters";
import ProductGrid from "@/components/ProductGrid";
import PromoBanners from "@/components/PromoBanners";
import { getCategories, listProducts, type ProductListParams } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { ensureSeeded } from "@/lib/seed";

type SP = Record<string, string | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const q = sp.q;
  // search / filtered views are crawlable but not separately indexed – canonical points to the clean catalog URL
  return buildMetadata({
    path: "/products",
    title: q ? `${q} – Vendors, Pricing & Quotes in India` : "B2B Technology Marketplace – Telecom, Cloud, Software & IT Solutions",
    description: q
      ? `Compare verified vendors for ${q} in India. See features, plans and indicative pricing, then request a quote on BANTConfirm.`
      : "Browse verified vendors for internet leased lines, SIP trunks, MPLS, cloud telephony, CRM, ERP, cloud and security solutions across India.",
    keywords: q ? [q, `${q} price in india`, `${q} provider`, `${q} for business`] : ["b2b marketplace india", "telecom solutions", "cloud solutions", "it software india", "sip trunk", "internet leased line"],
    noindex: !!q || !!sp.category || !!sp.maxPrice || !!sp.verified || !!sp.sort,
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await ensureSeeded();
  const params: ProductListParams = {
    q: sp.q,
    category: sp.category,
    sort: sp.sort as ProductListParams["sort"],
    featured: sp.featured === "true",
    verifiedOnly: sp.verified === "true",
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    limit: 12,
  };
  const [categories, data] = await Promise.all([getCategories(), listProducts(params)]);
  const gridParams: SP = { q: sp.q, category: sp.category, sort: sp.sort, featured: sp.featured, verified: sp.verified, maxPrice: sp.maxPrice };

  return (
    <main className="container-x py-8">
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">Home / Marketplace</nav>
      <h1 className="mt-1 text-2xl font-bold md:text-3xl">{sp.q ? <>Results for “{sp.q}”</> : "All business solutions"}</h1>
      <p className="mt-1 text-sm text-slate-500">{data.total} solutions from verified Indian vendors</p>
      <div className="mt-5">
        <Suspense fallback={<div className="skeleton h-20" />}>
          <Filters categories={categories} />
        </Suspense>
      </div>
      <div className="mt-6">
        <ProductGrid key={JSON.stringify(gridParams)} initial={data} params={gridParams} limit={12} emptyTitle={sp.q ? `No results for “${sp.q}”` : "No solutions found"} />
      </div>

      {/* promotional banners under the catalog */}
      <div className="mt-12">
        <Suspense fallback={<div className="skeleton h-[240px] rounded-2xl md:h-[300px]" />}>
          <PromoBanners />
        </Suspense>
      </div>
    </main>
  );
}
