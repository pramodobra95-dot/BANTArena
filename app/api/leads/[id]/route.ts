import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { logActivity } from "@/lib/queries";
import { LEAD_STATUSES } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const me = await getCurrentUser();
    if (!me || me.role === "buyer") return fail("Unauthorized", 401);
    const id = Number((await params).id);
    const { status } = z.object({ status: z.enum(LEAD_STATUSES) }).parse(await req.json());
    const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
    if (!lead) return fail("Lead not found", 404);
    if (me.role === "vendor" && lead.vendorId !== me.vendorId) return fail("Forbidden", 403);
    await db.update(leads).set({ status, updatedAt: new Date() }).where(eq(leads.id, id));
    await logActivity(me.id, "lead.status_changed", "lead", id, { status });
    return ok(true);
  } catch (e) {
    return handleError(e);
  }
}
