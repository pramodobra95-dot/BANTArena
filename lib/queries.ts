import { and, asc, desc, eq, ilike, or, sql, SQL, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { synonymAlternatives } from "./synonyms";
import { activityLogs, banners, categories, notifications, products, reviews, vendors } from "@/db/schema";

// Lightweight card projection – no heavy description/faq/plans fields.
const cardSelect = {
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
};

export type ProductCard = {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  imageUrl: string | null;
  priceFrom: string | null;
  priceUnit: string | null;
  ratingAvg: string;
  ratingCount: number;
  isFeatured: boolean;
  categoryName: string;
  categorySlug: string;
  vendorVerified: boolean;
};

export type ProductListParams = {
  q?: string;
  category?: string;
  sort?: "relevance" | "newest" | "rating" | "price_asc" | "price_desc" | "popular";
  featured?: boolean;
  popular?: boolean;
  minPrice?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  page?: number;
  limit?: number;
};

function tokenize(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !["for", "the", "and", "with", "a", "an", "of", "in"].includes(t));
}

export async function listProducts(params: ProductListParams) {
  const limit = Math.min(Math.max(params.limit ?? 12, 1), 48);
  const page = Math.max(params.page ?? 1, 1);
  const offset = (page - 1) * limit;
  const conds: SQL[] = [eq(products.status, "approved"), inArray(vendors.status, ["verified", "pending"])];

  if (params.category) conds.push(eq(categories.slug, params.category));
  if (params.featured) conds.push(eq(products.isFeatured, true));
  if (params.popular) conds.push(eq(products.isPopular, true));
  if (params.verifiedOnly) conds.push(eq(vendors.status, "verified"));
  if (params.minPrice !== undefined) conds.push(sql`${products.priceFrom} >= ${params.minPrice}`);
  if (params.maxPrice !== undefined) conds.push(sql`${products.priceFrom} <= ${params.maxPrice}`);

  let relevance: SQL<number> | null = null;
  const q = params.q?.trim();
  if (q) {
    const tokens = tokenize(q);
    const phrase = `%${q.toLowerCase()}%`;
    if (tokens.length === 0) {
      conds.push(or(ilike(products.name, phrase), ilike(products.searchText, phrase))!);
    } else {
      // every token must appear in search_text (name, category, vendor, keywords, features, description)
      // …or the query matches a known synonym/provider phrase (e.g. "landline" → "pri line").
      // Word-boundary matching avoids substring false positives such as "pri" inside "Enterprise".
      const wordMatch = (term: string) => sql`${products.searchText} ~* ${"[[:<:]]" + term.replace(/[^a-z0-9\s-]/g, "") + "[[:>:]]"}`;
      const alts = synonymAlternatives(q);
      conds.push(or(and(...tokens.map(wordMatch)), ...alts.map(wordMatch))!);
      const scoreParts = tokens.map(
        (t) =>
          sql`(CASE WHEN ${products.name} ILIKE ${"%" + t + "%"} THEN 5 ELSE 0 END + CASE WHEN COALESCE(${products.keywords},'') ILIKE ${"%" + t + "%"} THEN 3 ELSE 0 END + CASE WHEN ${categories.name} ILIKE ${"%" + t + "%"} THEN 2 ELSE 0 END)`
      );
      relevance = sql<number>`(CASE WHEN ${products.name} ILIKE ${phrase} THEN 20 ELSE 0 END + ${sql.join(scoreParts, sql` + `)})`;
    }
  }

  const orderBy: SQL[] = [];
  switch (params.sort) {
    case "newest":
      orderBy.push(desc(products.createdAt));
      break;
    case "rating":
      orderBy.push(desc(products.ratingAvg), desc(products.ratingCount));
      break;
    case "price_asc":
      orderBy.push(sql`${products.priceFrom} ASC NULLS LAST`);
      break;
    case "price_desc":
      orderBy.push(sql`${products.priceFrom} DESC NULLS LAST`);
      break;
    case "popular":
      orderBy.push(desc(products.isPopular), desc(products.viewCount));
      break;
    default:
      if (relevance) orderBy.push(desc(relevance));
      orderBy.push(desc(products.isFeatured), desc(products.ratingAvg), desc(products.viewCount));
  }

  const where = and(...conds);
  const [rows, countRows] = await Promise.all([
    db
      .select(cardSelect)
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit + 1)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(vendors, eq(products.vendorId, vendors.id))
      .where(where),
  ]);

  const hasMore = rows.length > limit;
  return {
    items: rows.slice(0, limit) as ProductCard[],
    page,
    limit,
    hasMore,
    total: countRows[0]?.count ?? 0,
  };
}

export const getCategories = unstable_cache(
  async () => {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        icon: categories.icon,
        description: categories.description,
        productCount: sql<number>`(select count(*)::int from ${products} p where p.category_id = ${categories.id} and p.status = 'approved')`,
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return rows;
  },
  ["categories-list"],
  { revalidate: 300, tags: ["categories"] }
);

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({ where: eq(categories.slug, slug) });
}

export async function getProductBySlug(slug: string) {
  const p = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "approved")),
    with: {
      category: true,
      vendor: {
        columns: {
          id: true,
          companyName: true,
          slug: true,
          city: true,
          state: true,
          status: true,
          yearsInBusiness: true,
          description: true,
          logoUrl: true,
          website: true,
        },
      },
    },
  });
  return p ?? null;
}

export async function getProductReviews(productId: number) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(20);
}

export async function getRelatedProducts(categoryId: number, excludeId: number) {
  const rows = await db
    .select(cardSelect)
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(and(eq(products.categoryId, categoryId), eq(products.status, "approved"), sql`${products.id} <> ${excludeId}`))
    .orderBy(desc(products.ratingAvg))
    .limit(4);
  return rows as ProductCard[];
}

export const getTrustedVendors = unstable_cache(
  async () => {
    return db
      .select({
        id: vendors.id,
        companyName: vendors.companyName,
        slug: vendors.slug,
        city: vendors.city,
        state: vendors.state,
        logoUrl: vendors.logoUrl,
        yearsInBusiness: vendors.yearsInBusiness,
        productCount: sql<number>`(select count(*)::int from ${products} p where p.vendor_id = ${vendors.id} and p.status='approved')`,
      })
      .from(vendors)
      .where(eq(vendors.status, "verified"))
      .orderBy(desc(vendors.isFeatured), desc(vendors.yearsInBusiness))
      .limit(8);
  },
  ["trusted-vendors"],
  { revalidate: 300, tags: ["vendors"] }
);

export async function logActivity(actorId: number | null, action: string, entity?: string, entityId?: number, meta?: Record<string, unknown>) {
  try {
    await db.insert(activityLogs).values({ actorId, action, entity, entityId, meta });
  } catch (e) {
    console.error("activity log failed", e);
  }
}

export async function notify(userId: number | null, title: string, body?: string, link?: string) {
  try {
    await db.insert(notifications).values({ userId, title, body, link });
  } catch (e) {
    console.error("notify failed", e);
  }
}

export const getPromoBanners = unstable_cache(
  async () => {
    return db
      .select({
        id: banners.id,
        title: banners.title,
        subtitle: banners.subtitle,
        imageUrl: banners.imageUrl,
        linkUrl: banners.linkUrl,
        altText: banners.altText,
        seoKeywords: banners.seoKeywords,
      })
      .from(banners)
      .where(and(eq(banners.isActive, true), eq(banners.position, "promo")))
      .orderBy(asc(banners.sortOrder), asc(banners.id));
  },
  ["promo-banners"],
  { revalidate: 300, tags: ["banners"] }
);

/* ---------------- SEO / internal-linking helpers ---------------- */

/** Vendors that actually offer approved products in a category (category → vendor internal links). */
export async function getCategoryVendors(categoryId: number, limit = 6) {
  return db
    .selectDistinct({ id: vendors.id, companyName: vendors.companyName, slug: vendors.slug, city: vendors.city, state: vendors.state })
    .from(vendors)
    .innerJoin(products, eq(products.vendorId, vendors.id))
    .where(and(eq(products.categoryId, categoryId), eq(products.status, "approved"), eq(vendors.status, "verified")))
    .limit(limit);
}

/** Verified vendors headquartered in a city (location → vendor internal links). */
export async function getVendorsByCity(city: string, limit = 8) {
  return db
    .select({ id: vendors.id, companyName: vendors.companyName, slug: vendors.slug, city: vendors.city, state: vendors.state })
    .from(vendors)
    .where(and(eq(vendors.status, "verified"), sql`lower(${vendors.city}) = lower(${city})`))
    .limit(limit);
}

/** Cities with genuine vendor presence – used for location pages & sitemap. */
export async function getVendorCities() {
  const rows = await db
    .selectDistinct({ city: vendors.city })
    .from(vendors)
    .where(and(eq(vendors.status, "verified"), sql`${vendors.city} is not null`));
  return rows.map((r) => r.city).filter((c): c is string => !!c);
}

/** Blog → product internal links: products genuinely mentioned in the article. */
export async function getBlogRelatedProducts(text: string, limit = 4) {
  const rows = await db
    .select({
      id: products.id, name: products.name, slug: products.slug, shortDescription: products.shortDescription, imageUrl: products.imageUrl,
      priceFrom: products.priceFrom, priceUnit: products.priceUnit, ratingAvg: products.ratingAvg, ratingCount: products.ratingCount,
      isFeatured: products.isFeatured, categoryName: categories.name, categorySlug: categories.slug,
      vendorVerified: sql<boolean>`${vendors.status} = 'verified'`,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(products.status, "approved"))
    .limit(120);
  const hay = ` ${text.toLowerCase()} `;
  const scored = rows
    .map((r) => {
      const words = r.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
      const hits = words.filter((w) => hay.includes(` ${w} `)).length;
      const catHit = hay.includes(r.categoryName.toLowerCase()) ? 1 : 0;
      return { r, score: hits * 2 + catHit };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored.map((x) => x.r);
}

/** Approved product slugs for the sitemap (kept light: slug + updatedAt only). */
export async function getAllProductSlugs() {
  return db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products).where(eq(products.status, "approved")).orderBy(desc(products.updatedAt));
}
