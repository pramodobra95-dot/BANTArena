import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { getVendorCities } from "@/lib/queries";
import { METRO_CITIES } from "@/lib/seo-hubs";
import { breadcrumbLd, buildMetadata } from "@/lib/seo";
import { ensureSeeded } from "@/lib/seed";
import { slugify } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/locations",
    title: "Business Technology Solutions by City in India",
    description: "Find verified telecom, cloud, software and IT vendors across Indian cities — Internet Leased Line, SIP Trunk, MPLS, cloud telephony, CRM, ERP and security.",
    keywords: ["it solutions india", "telecom vendors by city", "leased line delhi", "sip trunk mumbai", "cloud telephony bengaluru"],
  });
}

export default async function LocationsIndexPage() {
  await ensureSeeded();
  const cities = Array.from(new Set([...METRO_CITIES, ...(await getVendorCities())])).sort();
  return (
    <main className="container-x py-8">
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }])} />
      <h1 className="text-3xl font-bold">Solutions by city</h1>
      <p className="mt-2 max-w-3xl text-slate-600">Verified vendors on BANTConfirm serve businesses across India. Pick your city to see local vendors and the solutions most requested there.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cities.map((c) => (
          <li key={c}>
            <Link href={`/locations/${slugify(c)}`} className="card block p-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:border-accent hover:shadow-md">📍 {c}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
