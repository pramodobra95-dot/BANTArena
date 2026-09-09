import DashboardShell, { requireRole } from "@/components/DashboardShell";
import LeadsManager from "@/components/LeadsManager";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["vendor"], "/vendor/leads");
  return <DashboardShell me={me} title="Buyer enquiries"><LeadsManager canManage poll /></DashboardShell>;
}
