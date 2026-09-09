import DashboardShell, { requireRole } from "@/components/DashboardShell";
import VendorProfileForm from "@/components/VendorProfileForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["vendor"], "/vendor/profile");
  return <DashboardShell me={me} title="Company profile"><VendorProfileForm /></DashboardShell>;
}
