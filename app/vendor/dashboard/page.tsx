import Link from "next/link";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { leads, products } from "@/db/schema";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
import LeadsManager from "@/components/LeadsManager";
import { NotificationsPanel } from "@/components/LivePanels";
export const dynamic = "force-dynamic";
export default async function VendorDashboard() {
  const me = await requireRole(["vendor"], "/vendor/dashboard");
  const vid = me.vendorId ?? -1;
  const [[p], [l]] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int`, approved: sql<number>`count(*) filter (where status='approved')::int`, views: sql<number>`coalesce(sum(view_count),0)::int` }).from(products).where(eq(products.vendorId, vid)),
    db.select({ total: sql<number>`count(*)::int`, fresh: sql<number>`count(*) filter (where status='new')::int`, won: sql<number>`count(*) filter (where status='won')::int` }).from(leads).where(and(eq(leads.vendorId, vid))),
  ]);
  const cards = [["Products", p.total, `${p.approved} live`], ["Profile views", p.views, "all products"], ["Enquiries", l.total, `${l.fresh} new`], ["Deals won", l.won, "closed"]];
  return (
    <DashboardShell me={me} title="Vendor overview" actions={<Link href="/vendor/products/new" className="btn-primary">+ Add product</Link>}>
      {me.vendorStatus !== "verified" && <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your vendor account is <b>{me.vendorStatus}</b>. Products can be added now and go live after admin approval; the verified badge appears once KYC is complete.</div>}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{cards.map(([t, v, s]) => <div key={String(t)} className="card p-4"><p className="text-3xl font-extrabold">{v}</p><p className="text-sm font-medium">{t}</p><p className="text-xs text-slate-500">{s}</p></div>)}</div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><h2 className="mb-3 font-semibold">Recent enquiries</h2><LeadsManager canManage poll /></div>
        <NotificationsPanel />
      </div>
    </DashboardShell>
  );
}
