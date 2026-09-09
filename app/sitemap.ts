import type { MetadataRoute } from "next";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { blogs, categories, products, vendors } from "@/db/schema";
import { getVendorCities } from "@/lib/queries";
import { getSeoOverrides, abs } from "@/lib/seo";
import { SEO_HUBS } from "@/lib/seo-hubs";
import { SITE_URL, slugify } from "@/lib/utils";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const overrides = await getSeoOverrides();
  const excluded = (path: string) => {
    const ov = overrides[path];
    return !!ov && (ov.noindex || !ov.inSitemap);
  };

  const [ps, cs, vs, bs] = await Promise.all([
    db.select({ slug: products.slug, updatedAt: products.updatedAt, noindex: products.noindex }).from(products).where(and(eq(products.status, "approved"), eq(products.noindex, false))),
    db.select({ slug: categories.slug }).from(categories).where(eq(categories.isActive, true)),
    db.select({ slug: vendors.slug, updatedAt: vendors.updatedAt }).from(vendors).where(eq(vendors.status, "verified")),
    db.select({ slug: blogs.slug, createdAt: blogs.createdAt }).from(blogs).where(eq(blogs.isPublished, true)),
  ]);
  const cities = await getVendorCities();

  const staticPages: [string, number, "daily" | "weekly" | "monthly"][] = [
    ["/", 1, "daily"],
    ["/products", 0.9, "daily"],
    ["/categories", 0.8, "weekly"],
    ["/vendors", 0.7, "weekly"],
    ["/solutions", 0.8, "weekly"],
    ["/locations", 0.6, "monthly"],
    ["/blog", 0.7, "weekly"],
    ["/contact", 0.4, "monthly"],
    ["/about", 0.4, "monthly"],
    ["/vendor/register", 0.5, "monthly"],
  ];

  const entries: MetadataRoute.Sitemap = staticPages
    .filter(([p]) => !excluded(p))
    .map(([p, priority, changeFrequency]) => ({ url: abs(p), priority, changeFrequency, lastModified: new Date() }));

  for (const p of ps) {
    const path = `/products/${p.slug}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.9 });
  }
  for (const c of cs) {
    const path = `/categories/${c.slug}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), changeFrequency: "weekly", priority: 0.8 });
  }
  for (const v of vs) {
    const path = `/vendors/${v.slug}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), lastModified: v.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  }
  for (const h of SEO_HUBS) {
    const path = `/solutions/${h.slug}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), changeFrequency: "weekly", priority: 0.8 });
  }
  for (const b of bs) {
    const path = `/blog/${b.slug}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), lastModified: b.createdAt, changeFrequency: "monthly", priority: 0.6 });
  }
  const metros = ["Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "Gurugram", "Noida", "Jaipur", "Kochi"];
  for (const city of Array.from(new Set([...metros, ...cities]))) {
    const path = `/locations/${slugify(city)}`;
    if (excluded(path)) continue;
    entries.push({ url: abs(path), changeFrequency: "monthly", priority: 0.5 });
  }
  return entries;
}
