import { NextRequest } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, favourites, products, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return fail("Unauthorized", 401);
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  try {
    if (productId) {
      const [row] = await db.select({ id: favourites.id }).from(favourites).where(and(eq(favourites.userId, me.id), eq(favourites.productId, productId))).limit(1);
      return ok({ saved: !!row });
    }
    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        shortDescription: products.shortDescription,
        imageUrl: products.imageUrl,
        priceFrom: products.priceFrom,
        priceUnit: products.priceUnit,
        ratingAvg: products.ratingAvg,
        ratingCount: products.ratingCount,
        isFeatured: products.isFeatured,
        categoryName: categories.name,
        categorySlug: categories.slug,
        vendorVerified: sql<boolean>`${vendors.status} = 'verified'`,
      })
      .from(favourites)
      .innerJoin(products, eq(favourites.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(and(eq(favourites.userId, me.id), eq(products.status, "approved")))
      .orderBy(desc(favourites.createdAt));
    return ok(rows);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return fail("Please login to save products", 401);
    const { productId } = (await req.json()) as { productId?: number };
    if (!productId) return fail("productId required");
    const p = await db.query.products.findFirst({ where: eq(products.id, productId) });
    if (!p) return fail("Product not found", 404);
    const [existing] = await db.select({ id: favourites.id }).from(favourites).where(and(eq(favourites.userId, me.id), eq(favourites.productId, productId))).limit(1);
    if (existing) {
      await db.delete(favourites).where(eq(favourites.id, existing.id));
      return ok({ saved: false });
    }
    await db.insert(favourites).values({ userId: me.id, productId });
    return ok({ saved: true }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
