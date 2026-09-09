import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Shared notifications endpoint: admins see platform-wide (user_id null) + own; others see own.
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return fail("Unauthorized", 401);
  const where = me.role === "admin" ? or(isNull(notifications.userId), eq(notifications.userId, me.id)) : eq(notifications.userId, me.id);
  const rows = await db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(30);
  return ok(rows, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH() {
  const me = await getCurrentUser();
  if (!me) return fail("Unauthorized", 401);
  const where = me.role === "admin" ? or(isNull(notifications.userId), eq(notifications.userId, me.id)) : eq(notifications.userId, me.id);
  await db.update(notifications).set({ isRead: true }).where(and(where, eq(notifications.isRead, false)));
  return ok(true);
}
