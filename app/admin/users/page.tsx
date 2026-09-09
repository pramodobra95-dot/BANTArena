import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import AdminAction from "@/components/AdminAction";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["admin"], "/admin/users");
  const rows = await db.select({ id: users.id, name: users.name, email: users.email, role: users.role, company: users.company, emailVerified: users.emailVerified, isActive: users.isActive, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(500);
  return (
    <DashboardShell me={me} title="Users">
      <div className="card overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Verified</th><th className="p-3">Status</th><th className="p-3">Joined</th><th className="p-3">Actions</th></tr></thead>
        <tbody>{rows.map((u) => <tr key={u.id} className="border-t border-slate-100">
          <td className="p-3"><p className="font-medium">{u.name}</p><p className="text-xs text-slate-500">{u.email}{u.company ? ` · ${u.company}` : ""}</p></td>
          <td className="p-3 capitalize">{u.role}</td><td className="p-3">{u.emailVerified ? "✅" : "—"}</td>
          <td className="p-3"><span className={`badge ${u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{u.isActive ? "Active" : "Suspended"}</span></td>
          <td className="p-3 text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
          <td className="p-3"><div className="flex gap-1">{u.id !== me.id && <AdminAction url={`/api/admin/users/${u.id}`} body={{ isActive: !u.isActive }} label={u.isActive ? "Suspend" : "Activate"} />}{!u.emailVerified && <AdminAction url={`/api/admin/users/${u.id}`} body={{ emailVerified: true }} label="Mark verified" />}</div></td>
        </tr>)}</tbody></table></div>
    </DashboardShell>
  );
}
