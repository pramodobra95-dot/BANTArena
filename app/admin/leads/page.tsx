import DashboardShell, { requireRole } from "@/components/DashboardShell";
import LeadsManager from "@/components/LeadsManager";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["admin"], "/admin/leads");
  return <DashboardShell me={me} title="All leads"><LeadsManager canManage poll /></DashboardShell>;
}
