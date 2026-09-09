import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import ProductCard from "@/components/ProductCard";
import { getCategories, getVendorCities, getVendorsByCity, listProducts } from "@/lib/queries";
import { METRO_CITIES } from "@/lib/seo-hubs";
import { breadcrumbLd, buildMetadata, faqLd, itemListLd, resolveH1 } from "@/lib/seo";
import { ensureSeeded } from "@/lib/seed";
import { slugify } from "@/lib/utils";

export const revalidate = 3600;

async function cityList() {
  const fromDb = await getVendorCities();
  const all = Array.from(new Set([...METRO_CITIES, ...fromDb]));
  return all.map((name) => ({ name, slug: slugify(name) }));
}

export async function generateStaticParams() {
  await ensureSeeded();
  return (await cityList()).map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const found = (await cityList()).find((c) => c.slug === city);
  if (!found) return { title: "City not found", robots: { index: false, follow: false } };
  return buildMetadata({
    path: `/locations/${found.slug}`,
    title: `Business Technology Solutions in ${found.name} – Leased Line, SIP Trunk, Cloud & IT`,
    description: `Find verified vendors in ${found.name} for Internet Leased Line, SIP Trunk, MPLS, cloud telephony, CRM, ERP, AWS/Azure cloud and cyber security. Compare and request quotes.`,
    keywords: [`it solutions in ${found.name}`, `internet leased line in ${found.name}`, `sip trunk in ${found.name}`, `cloud telephony ${found.name}`, `telecom vendors ${found.name}`],
  });
}

export default async function LocationPage({ params }: { params: Promise<{ city: string }> }) {
  await ensureSeeded();
  const { city } = await params;
  const found = (await cityList()).find((c) => c.slug === city);
  if (!found) notFound();
  const name = found.name;
  const path = `/locations/${found.slug}`;

  const [h1, vendors, popular, cats] = await Promise.all([
    resolveH1(path, `Business Technology Solutions in ${name}`),
    getVendorsByCity(name),
    listProducts({ sort: "popular", limit: 6 }),
    getCategories(),
  ]);

  const faqs = [
    { q: `Which technology solutions are available in ${name}?`, a: `Verified vendors on BANTConfirm offer Internet Leased Lines, SIP trunks, MPLS, cloud telephony, business landline/PRI, CRM, ERP, billing software, AWS/Azure cloud and cyber security in ${name}. Most services are delivered pan-India with local on-site support where required.` },
    { q: `How do I find a reliable IT or telecom vendor in ${name}?`, a: `Compare the vendors and solutions listed on BANTConfirm — every vendor is GST-verified and KYC-checked. Submit one enquiry with your requirement and receive quotes, usually within one business day.` },
    { q: `Do vendors provide on-site installation in ${name}?`, a: `Connectivity services such as leased lines, PRI and MPLS require a feasibility check and on-site installation, which vendors arrange locally. Software and cloud services are typically deployed remotely.` },
  ];

  const ld = [
    breadcrumbLd([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }, { name, path }]),
    faqLd(faqs),
    itemListLd(`Verified technology vendors in ${name}`, vendors.map((v) => ({ name: v.companyName, url: `/vendors/${v.slug}` }))),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Business technology & telecom solutions in ${name}`,
      serviceType: "B2B technology marketplace",
      description: `Discover and compare verified vendors for connectivity, cloud, software and communication solutions in ${name}, India.`,
      url: `https://bantconfirm.com${path}`,
      areaServed: { "@type": "City", name },
      provider: { "@type": "Organization", name: "BANTConfirm" },
    },
  ].filter(Boolean);

  return (
    <main className="container-x max-w-5xl py-8">
      <JsonLd data={ld} />
      <nav className="text-xs text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand">Home</Link> / <Link href="/locations" className="hover:text-brand">Locations</Link> / <span className="text-slate-800">{name}</span>
      </nav>
      <h1 className="mt-3 text-3xl font-bold md:text-4xl">{h1}</h1>
      <p className="mt-3 text-lg text-slate-700">
        Businesses in {name} use BANTConfirm to compare Internet Leased Lines, SIP trunks, MPLS, cloud telephony, CRM, ERP, cloud hosting and security solutions from GST-verified vendors — and request quotes in one place.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-bold md:text-2xl">{vendors.length ? `Verified vendors based in ${name}` : `Vendors serving ${name}`}</h2>
        {vendors.length ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {vendors.map((v) => (
              <li key={v.id}>
                <Link href={`/vendors/${v.slug}`} className="card flex items-center gap-3 p-4 transition hover:border-accent">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand/10 text-lg font-bold text-brand">{v.companyName.charAt(0)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{v.companyName}</span>
                    <span className="block text-xs text-slate-500">✓ Verified · {[v.city, v.state].filter(Boolean).join(", ")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Several national vendors on BANTConfirm deliver to {name} with local installation and support. Browse the solutions below or <Link href="/contact" className="font-semibold text-brand hover:underline">post your requirement</Link> and we will match you with vendors covering {name}.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold md:text-2xl">Popular solutions requested in {name}</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {popular.items.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <Link href="/products" className="btn-outline mt-4">Browse all solutions</Link>
      </section>

      <section className="card mt-10 p-6">
        <h2 className="text-xl font-bold">{name} – FAQs</h2>
        <div className="mt-2"><Faq items={faqs} /></div>
      </section>

      <section className="mt-10 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Browse by category</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {cats.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{c.icon} {c.name}</Link>)}
        </div>
        <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-500">Other cities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(await cityList()).filter((c) => c.slug !== found.slug).slice(0, 12).map((c) => <Link key={c.slug} href={`/locations/${c.slug}`} className="badge border border-slate-200 bg-white text-slate-700 transition hover:border-brand hover:text-brand">{c.name}</Link>)}
        </div>
      </section>
    </main>
  );
}
