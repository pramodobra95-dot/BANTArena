import { db } from "@/db";
import { settings } from "@/db/schema";
import { SettingsForm } from "@/components/AdminForms";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["admin"], "/admin/settings");
  const rows = await db.select({ key: settings.key, value: settings.value }).from(settings).orderBy(settings.key);
  return <DashboardShell me={me} title="Platform settings"><p className="mb-4 text-sm text-slate-600">Set <code>auto_approve_products</code> to <code>true</code> to publish verified vendors&apos; products instantly.</p><SettingsForm initial={rows} /></DashboardShell>;
}
