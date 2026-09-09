import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, products, vendors } from "@/db/schema";
import AdminAction from "@/components/AdminAction";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
import { formatINR } from "@/lib/utils";
export const dynamic = "force-dynamic";
const C: Record<string, string> = { approved: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800", rejected: "bg-red-100 text-red-800", draft: "bg-slate-100" };
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireRole(["admin"], "/admin/products");
  const { status } = await searchParams;
  const rows = await db.select({ id: products.id, name: products.name, slug: products.slug, status: products.status, isFeatured: products.isFeatured, isPopular: products.isPopular, priceFrom: products.priceFrom, vendor: vendors.companyName, category: categories.name, views: products.viewCount }).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(status ? eq(products.status, status as "pending") : undefined).orderBy(sql`case when ${products.status}='pending' then 0 else 1 end`, desc(products.updatedAt)).limit(300);
  return (
    <DashboardShell me={me} title="Products" actions={<div className="flex gap-1">{["", "pending", "approved", "rejected"].map((s) => <Link key={s} href={s ? `/admin/products?status=${s}` : "/admin/products"} className={`badge capitalize ${(status ?? "") === s ? "bg-brand text-white" : "bg-white ring-1 ring-slate-200"}`}>{s || "All"}</Link>)}</div>}>
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Product</th><th className="p-3">Vendor</th><th className="p-3">Price</th><th className="p-3">Views</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((p) => <tr key={p.id} className="border-t border-slate-100">
          <td className="p-3"><Link href={`/products/${p.slug}`} className="font-medium hover:text-brand">{p.name}</Link><p className="text-xs text-slate-500">{p.category}{p.isFeatured && " · ★ Featured"}{p.isPopular && " · 🔥 Popular"}</p></td>
          <td className="p-3 text-slate-600">{p.vendor}</td><td className="p-3">{formatINR(p.priceFrom) ?? "Custom"}</td><td className="p-3">{p.views}</td>
          <td className="p-3"><span className={`badge capitalize ${C[p.status]}`}>{p.status}</span></td>
          <td className="p-3"><div className="flex flex-wrap gap-1">
            {p.status !== "approved" && <AdminAction url={`/api/admin/products/${p.id}`} body={{ status: "approved" }} label="Approve" className="btn-primary py-1 px-2 text-xs" />}
            {p.status !== "rejected" && <AdminAction url={`/api/admin/products/${p.id}`} body={{ status: "rejected" }} label="Reject" />}
            <AdminAction url={`/api/admin/products/${p.id}`} body={{ isFeatured: !p.isFeatured }} label={p.isFeatured ? "Unfeature" : "Feature"} />
            <AdminAction url={`/api/admin/products/${p.id}`} body={{ isPopular: !p.isPopular }} label={p.isPopular ? "Unpopular" : "Popular"} />
            <AdminAction url={`/api/admin/products/${p.id}`} method="DELETE" label="Delete" className="btn-outline py-1 px-2 text-xs text-red-600" confirmText="Delete this product permanently?" />
          </div></td>
        </tr>)}</tbody></table></div>
    </DashboardShell>
  );
}
