import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import JsonLd from "@/components/JsonLd";
import { breadcrumbLd, buildMetadata, itemListLd, organizationLd, websiteLd } from "@/lib/seo";
import AnimatedNumber from "@/components/AnimatedNumber";
import Reveal from "@/components/Reveal";
import SearchHero from "@/components/SearchHero";
import ProductGrid from "@/components/ProductGrid";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import PromoBanners from "@/components/PromoBanners";
import VendorMarquee from "@/components/VendorMarquee";
import { getCategories, listProducts } from "@/lib/queries";
import { ensureSeeded } from "@/lib/seed";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/",
    title: "BANTConfirm – B2B Technology, Telecom, Cloud & IT Solutions Marketplace India",
    description: "India's B2B technology marketplace. Compare Internet Leased Line, SIP Trunk, MPLS, Cloud Telephony, CRM, ERP, AWS, Azure, WhatsApp Business API and 2,000+ solutions from verified vendors. Get AI guidance and quotes in one business day.",
    keywords: ["b2b technology marketplace india", "it solutions marketplace", "telecom solutions india", "cloud solutions india", "business software india", "ai calling solutions", "technology vendors india", "it service providers india", "internet leased line", "sip trunk", "mpls"],
  });
}

const STATS: [number, string][] = [[500, "Verified vendors"], [2000, "B2B solutions"], [25000, "Quotes delivered"], [100, "Cities in India"]];

const STEPS = [
  ["1", "Search & compare", "Find products by name, category, vendor or use-case like “SIP trunk for AI agent”."],
  ["2", "Request a quote", "Share Budget, Authority, Need & Timeline once — we route it to the right verified vendor."],
  ["3", "Close with confidence", "Track responses, negotiate and buy from GST-registered, verified vendors."],
];

async function Categories() {
  const cats = await getCategories();
  return (
    <div className="stagger grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
      {cats.map((c) => (
        <Link key={c.id} href={`/categories/${c.slug}`} className="card group flex flex-col items-center gap-2 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-lg">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/5 text-2xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent/25">{c.icon}</span>
          <span className="text-sm font-semibold text-slate-800">{c.name}</span>
          <span className="text-xs text-slate-500">{c.productCount} solutions</span>
          <span className="h-0.5 w-0 rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-300 group-hover:w-full" />
        </Link>
      ))}
    </div>
  );
}

async function Featured() {
  const { items } = await listProducts({ featured: true, limit: 8 });
  return (
    <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} priority={i < 4} />
      ))}
    </div>
  );
}

async function Popular() {
  const data = await listProducts({ popular: true, sort: "popular", limit: 12 });
  return <ProductGrid initial={data} params={{ popular: "true", sort: "popular" }} limit={12} />;
}

function GridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function HomePage() {
  await ensureSeeded();
  const cats = await getCategories();
  return (
    <main>
      <JsonLd
        data={[
          organizationLd(),
          websiteLd(),
          breadcrumbLd([{ name: "Home", path: "/" }]),
          itemListLd("B2B solution categories", cats.map((c) => ({ name: c.name, url: `/categories/${c.slug}` }))),
        ]}
      />
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand to-blue-700 text-white">
        <div className="blob left-[-10%] top-[-20%] h-[28rem] w-[28rem] bg-accent/30" />
        <div className="blob right-[-8%] top-[10%] h-[24rem] w-[24rem] bg-blue-400/30" style={{ animationDelay: "-6s" }} />
        <div className="blob bottom-[-30%] left-[30%] h-[26rem] w-[26rem] bg-brand-deep" style={{ animationDelay: "-11s" }} />
        <div className="bg-dots absolute inset-0" />
        <div className="container-x relative py-16 text-center md:py-24">
          <span className="anim-fade-up badge bg-accent/15 text-accent ring-1 ring-accent/40 backdrop-blur" style={{ animationDelay: "60ms" }}>
            ⚡ India&apos;s BANT-qualified B2B tech marketplace
          </span>
          <h1 className="anim-fade-up mx-auto mt-5 max-w-4xl text-3xl font-extrabold leading-tight md:text-5xl" style={{ animationDelay: "140ms" }}>
            What business solution are you looking for?
          </h1>
          <p className="anim-fade-up mx-auto mt-4 max-w-2xl text-blue-100 md:text-lg" style={{ animationDelay: "220ms" }}>
            Compare Internet Leased Lines, SIP Trunks, MPLS, Cloud, CRM, ERP and 2,000+ solutions from verified telecom, cloud and IT vendors. Get quotes in one business day.
          </p>
          <div className="anim-fade-up" style={{ animationDelay: "300ms" }}>
            <SearchHero />
          </div>
          <dl className="anim-fade-up mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4" style={{ animationDelay: "420ms" }}>
            {STATS.map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-accent/40">
                <dt className="text-3xl font-extrabold text-accent">
                  <AnimatedNumber value={v} suffix="+" />
                </dt>
                <dd className="mt-1 text-xs text-blue-100 md:text-sm">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-slate-50" viewBox="0 0 1440 48" fill="currentColor" preserveAspectRatio="none" aria-hidden>
          <path d="M0 48h1440V12c-180 24-420 36-720 36S180 36 0 12v36z" />
        </svg>
      </section>

      {/* ================= CATEGORIES ================= */}
      <section className="container-x py-14">
        <Reveal>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-deep">Explore</p>
              <h2 className="text-2xl font-bold md:text-3xl">Browse by category</h2>
              <p className="mt-1 text-sm text-slate-500">Telecom, cloud, software, communication, automation, AI &amp; security</p>
            </div>
            <Link href="/categories" className="group hidden items-center gap-1 text-sm font-semibold text-brand sm:flex hover:underline">
              View all
              <span className="transition group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </Reveal>
        <Suspense fallback={<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}</div>}>
          <Categories />
        </Suspense>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="bg-white py-14">
        <div className="container-x">
          <Reveal>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-deep">Hand-picked</p>
                <h2 className="text-2xl font-bold md:text-3xl">Featured solutions</h2>
                <p className="mt-1 text-sm text-slate-500">High-demand products from verified vendors</p>
              </div>
              <Link href="/products?featured=true" className="group hidden items-center gap-1 text-sm font-semibold text-brand sm:flex hover:underline">
                See all <span className="transition group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
          <Suspense fallback={<GridSkeleton n={8} />}>
            <Featured />
          </Suspense>
        </div>
      </section>

      {/* ================= POPULAR + SHOW MORE ================= */}
      <section className="container-x py-14">
        <Reveal>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-deep">Most requested</p>
            <h2 className="text-2xl font-bold md:text-3xl">Popular solutions</h2>
            <p className="mt-1 text-sm text-slate-500">12 top picks to start — hit “Show more” to open the full marketplace</p>
          </div>
        </Reveal>
        <Suspense fallback={<GridSkeleton n={8} />}>
          <Popular />
        </Suspense>
      </section>

      {/* ============ PROMOTIONAL BANNERS (below the catalog) ============ */}
      <section className="container-x pb-14">
        <Reveal>
          <Suspense fallback={<div className="skeleton h-[240px] rounded-2xl sm:h-[260px] md:h-[300px]" />}>
            <PromoBanners />
          </Suspense>
        </Reveal>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="relative overflow-hidden bg-brand-deep py-14 text-white">
        <div className="blob left-[20%] top-[-40%] h-[24rem] w-[24rem] bg-accent/20" />
        <div className="container-x relative">
          <Reveal>
            <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent">Simple by design</p>
            <h2 className="mt-1 text-center text-2xl font-bold md:text-3xl">How BANTConfirm works</h2>
          </Reveal>
          <div className="stagger mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map(([n, t, d]) => (
              <div key={n} className="group rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-accent/50">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-lg font-black text-brand-dark shadow-lg transition-transform duration-300 group-hover:scale-110">{n}</span>
                  <hr className="hr-brand flex-1 opacity-40" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm text-blue-100">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= TRUSTED VENDORS MARQUEE ================= */}
      <section className="container-x py-14">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-deep">Our technology partners</p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">Trusted vendors &amp; service providers</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">GST-verified telecom, cloud and software companies selling on BANTConfirm — hover to pause the carousel</p>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <VendorMarquee />
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-6 text-center">
            <Link href="/vendors" className="btn-outline">
              View all verified vendors →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ================= VENDOR CTA ================= */}
      <section className="container-x pb-14">
        <Reveal>
          <div className="card relative overflow-hidden bg-gradient-to-r from-brand-dark via-brand to-blue-600 p-8 text-white md:p-10">
            <div className="blob right-[-10%] top-[-60%] h-72 w-72 bg-accent/30" />
            <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Are you a technology or telecom vendor? <span className="text-accent">Grow with BANTConfirm</span>
                </h2>
                <p className="mt-2 max-w-xl text-blue-100">List your products free, get GST/KYC verified, and receive BANT-qualified enquiries from businesses across India.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3 md:justify-start">
                  <Link href="/vendor/register" className="btn-accent px-6">Become a vendor</Link>
                  <Link href="/contact" className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">Talk to sales</Link>
                </div>
              </div>
              <div className="anim-float grid h-32 w-32 shrink-0 place-items-center rounded-3xl bg-accent/15 text-6xl ring-1 ring-accent/40">🚀</div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
