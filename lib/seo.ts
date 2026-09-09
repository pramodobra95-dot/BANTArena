import type { Metadata } from "next";
import { permanentRedirect, redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { redirects, seoOverrides } from "@/db/schema";
import { SITE_URL, slugify } from "./utils";

export type SeoOverride = {
  path: string;
  title: string | null;
  description: string | null;
  h1: string | null;
  keywords: string | null;
  canonical: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noindex: boolean;
  inSitemap: boolean;
  seoContent: string | null;
  altText: string | null;
};

export const getSeoOverrides = unstable_cache(
  async () => {
    const rows = await db.select().from(seoOverrides);
    return Object.fromEntries(rows.map((r) => [r.path, r as SeoOverride])) as Record<string, SeoOverride>;
  },
  ["seo-overrides"],
  { revalidate: 300, tags: ["seo"] }
);

export const getRedirectMap = unstable_cache(
  async () => {
    const rows = await db.select().from(redirects).where(eq(redirects.isActive, true));
    return Object.fromEntries(rows.map((r) => [r.fromPath, { to: r.toPath, status: r.statusCode === 302 ? 302 : 301 }])) as Record<
      string,
      { to: string; status: 301 | 302 }
    >;
  },
  ["redirect-map"],
  { revalidate: 60, tags: ["seo"] }
);

/**
 * Applies an admin-managed redirect (301/302) for a path.
 * Used as a page-level fallback so changed slugs never 404.
 */
export async function applySeoRedirect(path: string) {
  try {
    const map = await getRedirectMap();
    const hit = map[path];
    if (!hit) return false;
    if (hit.status === 302) redirect(hit.to);
    permanentRedirect(hit.to);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // rethrow Next redirect signals
    return false;
  }
  return false;
}

export function abs(path?: string | null) {
  if (!path) return SITE_URL;
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${cut.slice(0, sp > max * 0.6 ? sp : max).replace(/[,\-–;:]+$/, "")}…`;
}

const DEFAULT_OG_IMAGE = "/images/cat-it-software.jpg";

export type MetaInput = {
  path: string;
  title: string;
  description?: string | null;
  keywords?: string[] | string | null;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
};

/** Central metadata builder – merges admin SEO overrides, canonical, OG/Twitter and robots rules. */
export async function buildMetadata(m: MetaInput): Promise<Metadata> {
  const ov = (await getSeoOverrides())[m.path];
  // the root layout appends "| BANTConfirm" via metadata.template – strip any duplicate suffix
  const rawTitle = ov?.title || m.title;
  const title = rawTitle.replace(/\s*\|\s*BANTConfirm\s*$/i, "").trim();
  const description = truncate(ov?.description || m.description || title, 170);
  const canonical = abs(ov?.canonical || m.path);
  const image = ov?.ogImage || m.image || DEFAULT_OG_IMAGE;
  const kw = ov?.keywords ?? m.keywords ?? [];
  const keywords = (Array.isArray(kw) ? kw : String(kw).split(","))
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 30);
  const noindex = !!m.noindex || !!ov?.noindex;
  const ogTitle = ov?.ogTitle || title;
  const ogDescription = truncate(ov?.ogDescription || description, 200);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: "BANTConfirm",
      type: m.type ?? "website",
      locale: "en_IN",
      images: [{ url: abs(image), width: 1200, height: 630, alt: ogTitle }],
      ...(m.publishedTime ? { publishedTime: m.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, images: [abs(image)] },
    robots: {
      index: !noindex,
      follow: true,
      googleBot: { index: !noindex, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
  };
}

/** H1 resolution with admin override support. */
export async function resolveH1(path: string, fallback: string) {
  const ov = (await getSeoOverrides())[path];
  return ov?.h1 || fallback;
}
export async function resolveSeoContent(path: string) {
  const ov = (await getSeoOverrides())[path];
  return ov?.seoContent ?? null;
}
export async function resolveAlt(path: string, fallback: string) {
  const ov = (await getSeoOverrides())[path];
  return ov?.altText || fallback;
}

/* ---------------- JSON-LD builders ---------------- */

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BANTConfirm",
    url: SITE_URL,
    description: "BANTConfirm is an Indian B2B technology marketplace where businesses discover, compare and buy telecom, cloud, software, communication, AI-calling and security solutions from verified vendors.",
    areaServed: { "@type": "Country", name: "India" },
    contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "support@bantconfirm.com", availableLanguage: ["en", "hi"] },
    knowsAbout: ["Internet Leased Line", "SIP Trunk", "MPLS", "Cloud Telephony", "CRM", "ERP", "AWS", "Azure", "Bulk Email", "WhatsApp Business API", "AI Calling"],
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BANTConfirm",
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@type": "Organization", name: "BANTConfirm" },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/products?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function faqLd(faqs: { q: string; a: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function itemListLd(name: string, items: { name: string; url: string }[]) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.url) })),
  };
}

export function productLd(p: {
  name: string;
  slug: string;
  shortDescription: string | null;
  description?: string | null;
  imageUrl?: string | null;
  priceFrom?: string | null;
  ratingAvg?: string;
  ratingCount?: number;
  categoryName?: string;
  faqs?: { q: string; a: string }[];
  vendor: { companyName: string; slug: string; city?: string | null; state?: string | null };
}) {
  const hasPrice = !!p.priceFrom && Number(p.priceFrom) > 0;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: truncate(p.shortDescription || p.description || p.name, 300),
    image: p.imageUrl ? abs(p.imageUrl) : undefined,
    category: p.categoryName,
    url: abs(`/products/${p.slug}`),
    brand: { "@type": "Organization", name: p.vendor.companyName, url: abs(`/vendors/${p.vendor.slug}`) },
    manufacturer: { "@type": "Organization", name: p.vendor.companyName },
    aggregateRating:
      p.ratingCount && p.ratingCount > 0 ? { "@type": "AggregateRating", ratingValue: Number(p.ratingAvg ?? 0), reviewCount: p.ratingCount, bestRating: 5 } : undefined,
    offers: hasPrice
      ? {
          "@type": "Offer",
          url: abs(`/products/${p.slug}#pricing`),
          priceCurrency: "INR",
          price: p.priceFrom,
          availability: "https://schema.org/InStock",
          areaServed: { "@type": "Country", name: "India" },
          seller: { "@type": "Organization", name: p.vendor.companyName },
        }
      : {
          "@type": "Offer",
          url: abs(`/products/${p.slug}#enquire`),
          priceCurrency: "INR",
          priceSpecification: { "@type": "PriceSpecification", description: "Custom pricing – request a quote" },
          availability: "https://schema.org/InStock",
          areaServed: { "@type": "Country", name: "India" },
          seller: { "@type": "Organization", name: p.vendor.companyName },
        },
  };
}

/** Vendor profile schema – Organization (not LocalBusiness, to avoid misrepresenting third-party providers). */
export function vendorLd(v: {
  companyName: string;
  slug: string;
  description?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  yearsInBusiness?: number | null;
  serviceAreas?: string[];
  products?: { name: string; slug: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: v.companyName,
    url: abs(`/vendors/${v.slug}`),
    description: truncate(v.description || `${v.companyName} – verified technology vendor on BANTConfirm`, 300),
    ...(v.website ? { sameAs: [v.website] } : {}),
    ...(v.city || v.state ? { address: { "@type": "PostalAddress", addressLocality: v.city ?? undefined, addressRegion: v.state ?? undefined, addressCountry: "IN" } } : {}),
    ...(v.yearsInBusiness ? { foundingDate: String(new Date().getFullYear() - v.yearsInBusiness) } : {}),
    areaServed: (v.serviceAreas && v.serviceAreas.length ? v.serviceAreas : ["India"]).map((a) => ({ "@type": "Place", name: a })),
    makesOffer: (v.products ?? []).slice(0, 20).map((p) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: p.name, url: abs(`/products/${p.slug}`) }, areaServed: { "@type": "Country", name: "India" } })),
  };
}

export function serviceLd(name: string, description: string, url: string, providerName = "BANTConfirm verified vendors") {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name,
    description: truncate(description, 300),
    url: abs(url),
    provider: { "@type": "Organization", name: providerName },
    areaServed: { "@type": "Country", name: "India" },
    availableChannel: { "@type": "ServiceChannel", serviceUrl: abs(url), availableLanguage: ["en", "hi"] },
  };
}

export function articleLd(a: { title: string; slug: string; excerpt?: string | null; coverUrl?: string | null; createdAt: Date | string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(a.title, 110),
    description: a.excerpt ?? undefined,
    image: a.coverUrl ? abs(a.coverUrl) : undefined,
    datePublished: new Date(a.createdAt).toISOString(),
    author: { "@type": "Organization", name: "BANTConfirm" },
    publisher: { "@type": "Organization", name: "BANTConfirm", url: SITE_URL },
    mainEntityOfPage: abs(`/blog/${a.slug}`),
    inLanguage: "en-IN",
  };
}

/* ---------------- Automatic SEO field generation ---------------- */

export type AutoSeo = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  longTailKeywords: string;
  imageAlt: string;
};

/** Generates natural, non-stuffed SEO defaults for new/edited products (vendors & admins can override). */
export function autoProductSeo(input: { name: string; categoryName?: string | null; vendorName?: string | null; shortDescription?: string | null }): AutoSeo {
  const name = input.name.trim();
  const cat = input.categoryName ?? "business technology";
  const base = truncate(`${name} in India – Pricing, Features & Verified Vendors`, 65);
  const desc = truncate(
    input.shortDescription
      ? `${input.shortDescription} Compare ${name} plans and pricing from verified ${cat} vendors on BANTConfirm and request a quote in one business day.`
      : `Compare ${name} from verified ${cat} vendors in India. See features, plans and indicative pricing on BANTConfirm, then request a quote and get a response within one business day.`,
    165
  );
  const secondary = [
    `${name} price in india`,
    `${name} provider`,
    `${name} for business`,
    `${name} vendor`,
    `best ${name}`,
    `${name} quotation`,
    cat,
    input.vendorName ? `${input.vendorName} ${name}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const longTail = [
    `${name} price in india for small business`,
    `how to choose ${name} provider`,
    `${name} setup and onboarding in india`,
    `${name} plans and pricing comparison`,
  ].join(", ");
  return {
    slug: slugify(name),
    seoTitle: base,
    seoDescription: desc,
    seoH1: name,
    primaryKeyword: name.toLowerCase(),
    secondaryKeywords: secondary,
    longTailKeywords: longTail,
    imageAlt: truncate(`${name} – ${cat} solution offered by verified vendors in India`, 125),
  };
}

export { slugify };
