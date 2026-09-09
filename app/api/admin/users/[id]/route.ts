import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { logActivity } from "@/lib/queries";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const id = Number((await params).id);
    const b = z.object({ isActive: z.boolean().optional(), role: z.enum(["buyer", "vendor", "admin"]).optional(), emailVerified: z.boolean().optional() }).parse(await req.json());
    await db.update(users).set({ ...b, updatedAt: new Date() }).where(eq(users.id, id));
    await logActivity(a.me.id, "user.updated", "user", id, b);
    return ok(true);
  } catch (e) {
    return handleError(e);
  }
}
