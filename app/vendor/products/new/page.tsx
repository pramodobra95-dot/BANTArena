import DashboardShell, { requireRole } from "@/components/DashboardShell";
import ProductForm from "@/components/ProductForm";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["vendor"], "/vendor/products/new");
  return <DashboardShell me={me} title="Add new product"><ProductForm /></DashboardShell>;
}
