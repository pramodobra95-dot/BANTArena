import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, type SessionUser } from "@/lib/auth";
import VerifyBanner from "./VerifyBanner";

const NAVS = {
  vendor: [["/vendor/dashboard", "Overview"], ["/vendor/products", "My Products"], ["/vendor/products/new", "+ Add Product"], ["/vendor/leads", "Enquiries"], ["/vendor/profile", "Company Profile"]],
  admin: [["/admin", "Overview"], ["/admin/leads", "Leads"], ["/admin/vendors", "Vendors"], ["/admin/products", "Products"], ["/admin/users", "Users"], ["/admin/categories", "Categories"], ["/admin/content", "Banners & Blogs"], ["/admin/settings", "Settings"], ["/admin/seo", "SEO"]],
  buyer: [["/account", "My Enquiries"], ["/account/saved", "Saved Solutions"], ["/products", "Browse Marketplace"]],
};

export async function requireRole(roles: SessionUser["role"][], next: string) {
  const me = await getCurrentUser();
  if (!me) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!roles.includes(me.role)) redirect(me.role === "admin" ? "/admin" : me.role === "vendor" ? "/vendor/dashboard" : "/account");
  return me;
}

export default function DashboardShell({ me, title, children, actions }: { me: SessionUser; title: string; children: ReactNode; actions?: ReactNode }) {
  const nav = NAVS[me.role];
  return (
    <div className="container-x grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="card h-fit p-3 lg:sticky lg:top-20">
        <div className="mb-3 border-b border-slate-100 px-2 pb-3">
          <p className="truncate text-sm font-semibold">{me.vendorName ?? me.name}</p>
          <p className="text-xs capitalize text-slate-500">{me.role}{me.vendorStatus ? ` · ${me.vendorStatus}` : ""}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand/5 hover:text-brand">{label}</Link>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        {!me.emailVerified && <VerifyBanner />}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {actions}
        </div>
        {children}
      </section>
    </div>
  );
}
