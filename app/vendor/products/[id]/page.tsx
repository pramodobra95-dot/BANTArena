import DashboardShell, { requireRole } from "@/components/DashboardShell";
import ProductForm from "@/components/ProductForm";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireRole(["vendor"], "/vendor/products");
  const id = Number((await params).id);
  return <DashboardShell me={me} title="Edit product"><ProductForm productId={id} /></DashboardShell>;
}
