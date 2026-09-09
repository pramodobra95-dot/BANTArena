import Link from "next/link";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
import VendorProductsTable from "@/components/VendorProductsTable";
export const dynamic = "force-dynamic";
export default async function Page() {
  const me = await requireRole(["vendor"], "/vendor/products");
  return <DashboardShell me={me} title="My products" actions={<Link href="/vendor/products/new" className="btn-primary">+ Add product</Link>}><VendorProductsTable /></DashboardShell>;
}
