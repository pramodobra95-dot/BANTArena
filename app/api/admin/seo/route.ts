import { NextRequest } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { seoOverrides } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { logActivity } from "@/lib/queries";

const schema = z.object({
  path: z.string().min(1).max(300).transform((p) => (p.startsWith("/") ? p : `/${p}`)),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(600).optional().nullable(),
  h1: z.string().max(200).optional().nullable(),
  keywords: z.string().max(1000).optional().nullable(),
  canonical: z.string().max(400).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(600).optional().nullable(),
  ogImage: z.string().max(500).optional().nullable(),
  noindex: z.boolean().optional(),
  inSitemap: z.boolean().optional(),
  seoContent: z.string().max(20000).optional().nullable(),
  altText: z.string().max(300).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  return ok(await db.select().from(seoOverrides).orderBy(desc(seoOverrides.updatedAt)));
}

export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const b = schema.parse(await req.json());
    const { path, ...data } = b;
    const row = (
      await db
        .insert(seoOverrides)
        .values({ path, ...data })
        .onConflictDoUpdate({ target: seoOverrides.path, set: { ...data, updatedAt: new Date() } })
        .returning()
    )[0];
    await logActivity(a.me.id, "seo.override_saved", "seo_override", row.id, { path });
    revalidateTag("seo", "max");
    revalidatePath(path);
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return ok(false);
  await db.delete(seoOverrides).where(eq(seoOverrides.path, path));
  revalidateTag("seo", "max");
  revalidatePath(path);
  return ok(true);
}
