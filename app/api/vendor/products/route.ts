import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, settings, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { productInput } from "@/lib/product-schema";
import { logActivity, notify } from "@/lib/queries";
import { buildSearchText } from "@/lib/utils";
import { autoProductSeo } from "@/lib/seo";

export async function GET() {
  const me = await getCurrentUser();
  if (!me || me.role !== "vendor" || !me.vendorId) return fail("Unauthorized", 401);
  const rows = await db
    .select({ id: products.id, name: products.name, slug: products.slug, status: products.status, priceFrom: products.priceFrom, priceUnit: products.priceUnit, imageUrl: products.imageUrl, viewCount: products.viewCount, ratingAvg: products.ratingAvg, categoryName: categories.name, isFeatured: products.isFeatured, updatedAt: products.updatedAt })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.vendorId, me.vendorId))
    .orderBy(desc(products.updatedAt));
  return ok(rows);
}

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role !== "vendor" || !me.vendorId) return fail("Unauthorized", 401);
    const body = productInput.parse(await req.json());
    const [cat, vendor, autoApprove] = await Promise.all([
      db.query.categories.findFirst({ where: eq(categories.id, body.categoryId) }),
      db.query.vendors.findFirst({ where: eq(vendors.id, me.vendorId) }),
      db.query.settings.findFirst({ where: eq(settings.key, "auto_approve_products") }),
    ]);
    if (!cat || !vendor) return fail("Invalid category", 422);
    // automatic SEO defaults – vendors/admins can override every field
    const auto = autoProductSeo({ name: body.name, categoryName: cat.name, vendorName: vendor.companyName, shortDescription: body.shortDescription });
    let slug = auto.slug;
    if (await db.query.products.findFirst({ where: eq(products.slug, slug) })) slug = `${slug}-${Date.now().toString(36)}`;
    const status = autoApprove?.value === "true" && vendor.status === "verified" ? "approved" : "pending";
    const [p] = await db
      .insert(products)
      .values({
        vendorId: me.vendorId, categoryId: cat.id, name: body.name, slug,
        shortDescription: body.shortDescription || null, description: body.description || null,
        features: body.features, plans: body.plans, faqs: body.faqs,
        imageUrl: body.imageUrl || `/images/cat-${cat.slug}.jpg`, brochureUrl: body.brochureUrl || null, videoUrl: body.videoUrl || null,
        priceFrom: body.priceFrom === "" || body.priceFrom == null ? null : String(body.priceFrom), priceUnit: body.priceUnit || null,
        searchText: buildSearchText({ name: body.name, shortDescription: body.shortDescription, description: body.description, keywords: body.keywords, features: body.features, categoryName: cat.name, vendorName: vendor.companyName }),
        seoTitle: body.seoTitle || auto.seoTitle,
        seoDescription: body.seoDescription || auto.seoDescription,
        seoH1: body.seoH1 || auto.seoH1,
        primaryKeyword: body.primaryKeyword || auto.primaryKeyword,
        secondaryKeywords: body.secondaryKeywords || auto.secondaryKeywords,
        imageAlt: body.imageAlt || auto.imageAlt,
        keywords: body.keywords || `${auto.primaryKeyword}, ${auto.secondaryKeywords}`,
        status,
      })
      .returning({ id: products.id, slug: products.slug, status: products.status });
    await logActivity(me.id, "product.created", "product", p.id, { name: body.name });
    if (status === "pending") await notify(null, "Product awaiting approval", `${vendor.companyName} submitted “${body.name}”`, "/admin/products");
    return ok(p, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
