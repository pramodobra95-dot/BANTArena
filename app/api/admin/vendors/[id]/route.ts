import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { logActivity, notify } from "@/lib/queries";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const id = Number((await params).id);
    const b = z.object({ status: z.enum(["pending", "verified", "rejected", "suspended"]).optional(), isFeatured: z.boolean().optional() }).parse(await req.json());
    const [v] = await db.update(vendors).set({ ...b, updatedAt: new Date() }).where(eq(vendors.id, id)).returning();
    if (b.status) await notify(v.userId, `Vendor account ${b.status}`, `Your vendor profile status is now “${b.status}”.`, "/vendor/dashboard");
    await logActivity(a.me.id, "vendor.updated", "vendor", id, b);
    revalidateTag("vendors", "max");
    return ok(v);
  } catch (e) {
    return handleError(e);
  }
}
