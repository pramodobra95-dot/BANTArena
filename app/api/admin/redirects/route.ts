import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { redirects } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { logActivity } from "@/lib/queries";

const schema = z.object({
  id: z.number().optional(),
  fromPath: z.string().min(1).max(300).transform((p) => (p.startsWith("/") ? p : `/${p}`)),
  toPath: z.string().min(1).max(400).transform((p) => (p.startsWith("/") ? p : `/${p}`)),
  statusCode: z.union([z.literal(301), z.literal(302)]).default(301),
  isActive: z.boolean().default(true),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  return ok(await db.select().from(redirects).orderBy(desc(redirects.createdAt)));
}

export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const { id, ...data } = schema.parse(await req.json());
    const row = id
      ? (await db.update(redirects).set(data).where(eq(redirects.id, id)).returning())[0]
      : (
          await db
            .insert(redirects)
            .values(data)
            .onConflictDoUpdate({ target: redirects.fromPath, set: data })
            .returning()
        )[0];
    await logActivity(a.me.id, "seo.redirect_saved", "redirect", row.id, { from: data.fromPath, to: data.toPath });
    revalidateTag("seo", "max");
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const id = Number(req.nextUrl.searchParams.get("id"));
  await db.delete(redirects).where(eq(redirects.id, id));
  revalidateTag("seo", "max");
  return ok(true);
}
