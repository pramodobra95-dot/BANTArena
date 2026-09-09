import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { productInput } from "@/lib/product-schema";
import { logActivity } from "@/lib/queries";
import { buildSearchText } from "@/lib/utils";
import { autoProductSeo } from "@/lib/seo";

async function own(id: number) {
  const me = await getCurrentUser();
  if (!me) return null;
  const p = await db.query.products.findFirst({ where: me.role === "admin" ? eq(products.id, id) : and(eq(products.id, id), eq(products.vendorId, me.vendorId ?? -1)) });
  return p ? { me, p } : null;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await own(Number((await params).id));
  if (!r) return fail("Not found", 404);
  return ok(r.p);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const r = await own(Number((await params).id));
    if (!r) return fail("Not found", 404);
    const body = productInput.partial().parse(await req.json());
    const cat = await db.query.categories.findFirst({ where: eq(categories.id, body.categoryId ?? r.p.categoryId) });
    const vendor = await db.query.vendors.findFirst({ where: eq(vendors.id, r.p.vendorId) });
    const merged = { ...r.p, ...body };
    const auto = autoProductSeo({ name: merged.name, categoryName: cat?.name, vendorName: vendor?.companyName, shortDescription: merged.shortDescription });
    await db
      .update(products)
      .set({
        name: merged.name, categoryId: cat?.id ?? r.p.categoryId,
        shortDescription: merged.shortDescription || null, description: merged.description || null,
        features: merged.features ?? [], plans: merged.plans ?? [], faqs: merged.faqs ?? [],
        imageUrl: merged.imageUrl || null, brochureUrl: merged.brochureUrl || null, videoUrl: merged.videoUrl || null,
        priceFrom: merged.priceFrom === "" || merged.priceFrom == null ? null : String(merged.priceFrom), priceUnit: merged.priceUnit || null,
        keywords: merged.keywords || null,
        searchText: buildSearchText({ name: merged.name, shortDescription: merged.shortDescription, description: merged.description, keywords: merged.keywords, features: merged.features ?? [], categoryName: cat?.name, vendorName: vendor?.companyName }),
        seoTitle: merged.seoTitle || auto.seoTitle,
        seoDescription: merged.seoDescription || auto.seoDescription,
        seoH1: merged.seoH1 || auto.seoH1,
        primaryKeyword: merged.primaryKeyword || auto.primaryKeyword,
        secondaryKeywords: merged.secondaryKeywords || auto.secondaryKeywords,
        imageAlt: merged.imageAlt || auto.imageAlt,
        // edits by vendors to approved products go back to review
        status: r.me.role === "admin" ? r.p.status : r.p.status === "approved" ? "pending" : r.p.status,
        updatedAt: new Date(),
      })
      .where(eq(products.id, r.p.id));
    await logActivity(r.me.id, "product.updated", "product", r.p.id);
    return ok(true);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await own(Number((await params).id));
  if (!r) return fail("Not found", 404);
  await db.delete(products).where(eq(products.id, r.p.id));
  await logActivity(r.me.id, "product.deleted", "product", r.p.id);
  return ok(true);
}
