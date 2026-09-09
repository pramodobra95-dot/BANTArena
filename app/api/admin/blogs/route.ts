import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/utils";

const schema = z.object({ id: z.number().optional(), title: z.string().min(3).max(220), excerpt: z.string().max(500).optional(), content: z.string().min(10), coverUrl: z.string().max(500).optional(), isPublished: z.boolean().default(false), seoKeywords: z.string().max(500).optional() });

export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  return ok(await db.select({ id: blogs.id, title: blogs.title, slug: blogs.slug, isPublished: blogs.isPublished, createdAt: blogs.createdAt, excerpt: blogs.excerpt, content: blogs.content, coverUrl: blogs.coverUrl, seoKeywords: blogs.seoKeywords }).from(blogs).orderBy(desc(blogs.createdAt)));
}
export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const { id, ...data } = schema.parse(await req.json());
    const row = id
      ? (await db.update(blogs).set(data).where(eq(blogs.id, id)).returning())[0]
      : (await db.insert(blogs).values({ ...data, slug: `${slugify(data.title)}-${Date.now().toString(36)}`, authorId: a.me.id }).returning())[0];
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}
export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  await db.delete(blogs).where(eq(blogs.id, Number(new URL(req.url).searchParams.get("id"))));
  return ok(true);
}
