import DashboardShell, { requireRole } from "@/components/DashboardShell";
import LeadsManager from "@/components/LeadsManager";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["buyer", "admin", "vendor"], "/account");
  return <DashboardShell me={me} title="My enquiries"><p className="mb-4 text-sm text-slate-600">Track the status of every quote request and message the vendor directly.</p><LeadsManager canManage={me.role !== "buyer"} /></DashboardShell>;
}
