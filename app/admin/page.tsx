import DashboardShell, { requireRole } from "@/components/DashboardShell";
import { ActivityFeed, AdminStats, NotificationsPanel } from "@/components/LivePanels";
import LeadsManager from "@/components/LeadsManager";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const me = await requireRole(["admin"], "/admin");
  return (
    <DashboardShell me={me} title="Platform overview">
      <AdminStats />
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><ActivityFeed /><NotificationsPanel /></div>
      <div className="mt-6"><h2 className="mb-3 font-semibold">Latest leads</h2><LeadsManager canManage poll /></div>
    </DashboardShell>
  );
}
