import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const rows = await db
    .select({ id: activityLogs.id, action: activityLogs.action, entity: activityLogs.entity, entityId: activityLogs.entityId, meta: activityLogs.meta, createdAt: activityLogs.createdAt, actor: users.name })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.actorId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(30);
  return ok(rows, { headers: { "Cache-Control": "no-store" } });
}
