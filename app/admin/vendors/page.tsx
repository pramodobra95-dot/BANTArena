import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, users, vendors } from "@/db/schema";
import AdminAction from "@/components/AdminAction";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
const C: Record<string, string> = { verified: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800", rejected: "bg-red-100 text-red-800", suspended: "bg-slate-200" };
export default async function Page() {
  const me = await requireRole(["admin"], "/admin/vendors");
  const rows = await db.select({ id: vendors.id, companyName: vendors.companyName, city: vendors.city, gst: vendors.gstNumber, status: vendors.status, isFeatured: vendors.isFeatured, email: users.email, createdAt: vendors.createdAt, count: sql<number>`(select count(*)::int from ${products} p where p.vendor_id=${vendors.id})` }).from(vendors).innerJoin(users, eq(vendors.userId, users.id)).orderBy(sql`case when ${vendors.status}='pending' then 0 else 1 end`, desc(vendors.createdAt));
  return (
    <DashboardShell me={me} title="Vendors">
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Company</th><th className="p-3">Contact</th><th className="p-3">GST</th><th className="p-3">Products</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((v) => <tr key={v.id} className="border-t border-slate-100">
          <td className="p-3 font-medium">{v.companyName}{v.isFeatured && <span className="badge ml-1 bg-accent text-white">★</span>}<p className="text-xs font-normal text-slate-500">{v.city}</p></td>
          <td className="p-3 text-slate-600">{v.email}</td><td className="p-3 font-mono text-xs">{v.gst ?? "—"}</td><td className="p-3">{v.count}</td>
          <td className="p-3"><span className={`badge capitalize ${C[v.status]}`}>{v.status}</span></td>
          <td className="p-3"><div className="flex flex-wrap gap-1">
            {v.status !== "verified" && <AdminAction url={`/api/admin/vendors/${v.id}`} body={{ status: "verified" }} label="Verify" className="btn-primary py-1 px-2 text-xs" />}
            {v.status === "pending" && <AdminAction url={`/api/admin/vendors/${v.id}`} body={{ status: "rejected" }} label="Reject" />}
            {v.status === "verified" && <AdminAction url={`/api/admin/vendors/${v.id}`} body={{ status: "suspended" }} label="Suspend" />}
            <AdminAction url={`/api/admin/vendors/${v.id}`} body={{ isFeatured: !v.isFeatured }} label={v.isFeatured ? "Unfeature" : "Feature"} />
          </div></td>
        </tr>)}</tbody></table></div>
    </DashboardShell>
  );
}
