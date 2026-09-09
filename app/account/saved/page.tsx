import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, favourites, products, vendors } from "@/db/schema";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
import ProductCard from "@/components/ProductCard";
import type { ProductCard as PC } from "@/lib/queries";
export const dynamic = "force-dynamic";
export default async function SavedPage() {
  const me = await requireRole(["buyer", "vendor", "admin"], "/account/saved");
  const rows = (await db
    .select({
      id: products.id, name: products.name, slug: products.slug, shortDescription: products.shortDescription, imageUrl: products.imageUrl,
      priceFrom: products.priceFrom, priceUnit: products.priceUnit, ratingAvg: products.ratingAvg, ratingCount: products.ratingCount,
      isFeatured: products.isFeatured, categoryName: categories.name, categorySlug: categories.slug,
      vendorVerified: sql<boolean>`${vendors.status} = 'verified'`,
    })
    .from(favourites)
    .innerJoin(products, eq(favourites.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(eq(favourites.userId, me.id), eq(products.status, "approved")))
    .orderBy(desc(favourites.createdAt))) as PC[];
  return (
    <DashboardShell me={me} title="Saved solutions">
      {rows.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl">💛</p>
          <p className="mt-3 text-lg font-semibold">No saved solutions yet</p>
          <p className="mt-1 text-sm text-slate-500">Tap the ♥ on any product card to shortlist it here for later comparison.</p>
          <Link href="/products" className="btn-primary mt-5">Browse marketplace</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </DashboardShell>
  );
}
