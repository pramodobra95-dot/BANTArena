import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SEO_HUBS } from "@/lib/seo-hubs";
import { breadcrumbLd, buildMetadata, itemListLd } from "@/lib/seo";

export const revalidate = 3600;
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/solutions",
    title: "B2B Technology Buying Guides – Prices, Providers & Comparisons",
    description: "Practical buying guides for SIP trunks, Internet Leased Lines, MPLS, cloud telephony, bulk email/SMS, WhatsApp Business API, AI calling, CRM, ERP and cloud in India.",
    keywords: ["sip trunk price india", "internet leased line provider", "mpls provider", "cloud telephony india", "bulk sms provider", "ai calling solution"],
  });
}

export default function SolutionsIndexPage() {
  return (
    <main className="container-x py-8">
      <JsonLd data={[breadcrumbLd([{ name: "Home", path: "/" }, { name: "Solution Guides", path: "/solutions" }]), itemListLd("B2B technology buying guides", SEO_HUBS.map((h) => ({ name: h.h1, url: `/solutions/${h.slug}` })))]} />
      <h1 className="text-3xl font-bold">B2B technology buying guides</h1>
      <p className="mt-2 max-w-3xl text-slate-600">
        Honest, practical guides on pricing, providers and comparisons for the technology Indian businesses actually buy. Each guide links to live listings from verified vendors so you can request a quote straight away.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SEO_HUBS.map((h) => (
          <li key={h.slug}>
            <Link href={`/solutions/${h.slug}`} className="card flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">
              <h2 className="font-semibold text-slate-900">{h.h1}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{h.description}</p>
              <span className="mt-3 text-xs font-semibold text-brand">Read guide →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
