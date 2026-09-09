import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import AdminAction from "@/components/AdminAction";
import { CategoryForm } from "@/components/AdminForms";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["admin"], "/admin/categories");
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder));
  return (
    <DashboardShell me={me} title="Categories">
      <CategoryForm />
      <div className="card mt-6 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Category</th><th className="p-3">Slug</th><th className="p-3">Keywords</th><th className="p-3">Active</th><th className="p-3"></th></tr></thead>
        <tbody>{rows.map((c) => <tr key={c.id} className="border-t border-slate-100"><td className="p-3 font-medium">{c.icon} {c.name}</td><td className="p-3 font-mono text-xs">/categories/{c.slug}</td><td className="p-3 text-xs text-slate-500">{c.seoKeywords}</td><td className="p-3">{c.isActive ? "✅" : "—"}</td><td className="p-3"><AdminAction url="/api/admin/categories" method="POST" body={{ id: c.id, name: c.name, icon: c.icon, description: c.description, seoKeywords: c.seoKeywords, sortOrder: c.sortOrder, isActive: !c.isActive }} label={c.isActive ? "Disable" : "Enable"} /></td></tr>)}</tbody></table></div>
    </DashboardShell>
  );
}
