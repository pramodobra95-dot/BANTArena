import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const schema = z.object({ id: z.number().optional(), name: z.string().min(2).max(120), icon: z.string().max(10).optional(), description: z.string().max(1000).optional(), seoKeywords: z.string().max(500).optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() });

export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const b = schema.parse(await req.json());
    const data = { name: b.name, icon: b.icon, description: b.description, seoKeywords: b.seoKeywords, isActive: b.isActive ?? true, sortOrder: b.sortOrder ?? 0, seoTitle: `${b.name} Solutions in India | BANTConfirm`, seoDescription: b.description };
    const row = b.id
      ? (await db.update(categories).set(data).where(eq(categories.id, b.id)).returning())[0]
      : (await db.insert(categories).values({ ...data, slug: slugify(b.name) }).returning())[0];
    revalidateTag("categories", "max");
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}
