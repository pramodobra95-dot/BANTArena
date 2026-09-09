import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { products, vendors } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { logActivity, notify } from "@/lib/queries";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const id = Number((await params).id);
    const b = z.object({ status: z.enum(["draft", "pending", "approved", "rejected"]).optional(), isFeatured: z.boolean().optional(), isPopular: z.boolean().optional() }).parse(await req.json());
    const [p] = await db.update(products).set({ ...b, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (b.status) {
      const v = await db.query.vendors.findFirst({ where: eq(vendors.id, p.vendorId) });
      if (v) await notify(v.userId, `Product ${b.status}`, `“${p.name}” is now ${b.status}.`, "/vendor/products");
    }
    await logActivity(a.me.id, "product.moderated", "product", id, b);
    revalidateTag("categories", "max");
    return ok(p);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const id = Number((await params).id);
  await db.delete(products).where(eq(products.id, id));
  await logActivity(a.me.id, "product.deleted", "product", id);
  return ok(true);
}
