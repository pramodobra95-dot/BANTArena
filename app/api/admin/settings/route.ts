import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  return ok(await db.select().from(settings).orderBy(settings.key));
}
export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const items = z.array(z.object({ key: z.string().min(1).max(80), value: z.string().max(2000) })).parse(await req.json());
    for (const it of items) {
      await db.insert(settings).values({ key: it.key, value: it.value }).onConflictDoUpdate({ target: settings.key, set: { value: it.value, updatedAt: new Date() } });
    }
    return ok(true);
  } catch (e) {
    return handleError(e);
  }
}
