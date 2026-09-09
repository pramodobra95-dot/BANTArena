"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Me = { id: number; name: string; role: "buyer" | "vendor" | "admin"; vendorStatus: string | null } | null;

const NAV = [
  { href: "/products", label: "Marketplace" },
  { href: "/categories", label: "Categories" },
  { href: "/vendors", label: "Vendors" },
  { href: "/blog", label: "Insights" },
];

function Wordmark() {
  return (
    <span className="brand-wordmark text-xl">
      <span className="brand-bant">BANT</span>
      <span className="brand-confirm">Confirm</span>
    </span>
  );
}

export default function Header() {
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMe(d.data ?? null))
      .catch(() => setMe(null));
  }, []);

  const dashboardHref = me?.role === "admin" ? "/admin" : me?.role === "vendor" ? "/vendor/dashboard" : "/account";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    router.push("/");
    router.refresh();
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="BANTConfirm home">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-lg font-black text-white shadow-sm">B</span>
          <Wordmark />
        </Link>

        <form onSubmit={submitSearch} className="hidden flex-1 md:block" role="search">
          <div className="group relative mx-auto max-w-xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="input pl-10 transition-all duration-300 group-focus-within:border-brand group-focus-within:shadow-[0_0_0_4px_rgba(15,61,145,0.08)]"
              placeholder="Search SIP Trunk, MPLS, Leased Line, CRM…"
              aria-label="Search products"
            />
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </div>
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`btn-ghost px-3 link-underline ${pathname.startsWith(n.href) ? "active" : ""}`}>
              {n.label}
            </Link>
          ))}
          {me === undefined ? (
            <span className="skeleton h-9 w-24" />
          ) : me ? (
            <>
              <Link href={dashboardHref} className="btn-outline">
                {me.role === "admin" ? "Admin" : me.role === "vendor" ? "Vendor Dashboard" : "My Account"}
              </Link>
              <button onClick={logout} className="btn-ghost">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
              <Link href="/vendor/register" className="btn-accent">
                Sell on BANTConfirm
              </Link>
            </>
          )}
        </nav>

        <button className="ml-auto rounded-lg p-2 transition hover:bg-slate-100 active:scale-95 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="anim-fade-in border-t border-slate-200 bg-white lg:hidden">
          <div className="container-x flex flex-col gap-1 py-3">
            <form onSubmit={submitSearch} className="mb-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search solutions…" />
            </form>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="btn-ghost justify-start">
                {n.label}
              </Link>
            ))}
            {me ? (
              <>
                <Link href={dashboardHref} onClick={() => setOpen(false)} className="btn-outline">
                  Dashboard
                </Link>
                <button onClick={logout} className="btn-ghost">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="btn-outline">
                  Login
                </Link>
                <Link href="/vendor/register" onClick={() => setOpen(false)} className="btn-accent">
                  Sell on BANTConfirm
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
