import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, redirects, seoOverrides, vendors } from "@/db/schema";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
import { RedirectsManager, SeoOverridesManager } from "@/components/SeoManager";
import { SEO_HUBS } from "@/lib/seo-hubs";
import { SITE_URL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSeoPage() {
  const me = await requireRole(["admin"], "/admin/seo");
  const [overrides, redirs, prods, cats, vens] = await Promise.all([
    db.select().from(seoOverrides),
    db.select().from(redirects),
    db.select({ slug: products.slug }).from(products).where(eq(products.status, "approved")).limit(60),
    db.select({ slug: categories.slug }).from(categories),
    db.select({ slug: vendors.slug }).from(vendors).limit(40),
  ]);
  const suggestions = [
    "/", "/products", "/categories", "/vendors", "/solutions", "/locations", "/blog", "/contact",
    ...prods.map((p) => `/products/${p.slug}`),
    ...cats.map((c) => `/categories/${c.slug}`),
    ...vens.map((v) => `/vendors/${v.slug}`),
    ...SEO_HUBS.map((h) => `/solutions/${h.slug}`),
  ];
  return (
    <DashboardShell
      me={me}
      title="SEO management"
      actions={
        <div className="flex gap-2">
          <Link href="/sitemap.xml" target="_blank" className="btn-outline py-1.5 text-xs">sitemap.xml</Link>
          <Link href="/robots.txt" target="_blank" className="btn-outline py-1.5 text-xs">robots.txt</Link>
        </div>
      }
    >
      <p className="mb-4 text-sm text-slate-600">
        Override the auto-generated SEO of any page — meta title, description, H1, keywords, canonical, Open Graph, alt text, extra on-page copy, index/noindex and sitemap inclusion.
        Every product, category, vendor, guide and city page already generates unique SEO automatically; overrides are optional.
      </p>
      <h2 className="mb-2 font-semibold">Page SEO overrides</h2>
      <SeoOverridesManager initial={overrides} suggestions={suggestions} />
      <h2 className="mb-2 mt-8 font-semibold">301 / 302 redirects</h2>
      <p className="mb-2 text-xs text-slate-500">Use when a product, vendor or guide slug changes so old URLs keep their ranking. Host: {SITE_URL}</p>
      <RedirectsManager initial={redirs} />
    </DashboardShell>
  );
}
