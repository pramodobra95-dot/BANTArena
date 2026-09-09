import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

const schema = z.object({ id: z.number().optional(), title: z.string().min(2).max(200), subtitle: z.string().max(500).optional(), imageUrl: z.string().max(500).optional(), linkUrl: z.string().max(300).optional(), altText: z.string().max(300).optional(), seoKeywords: z.string().max(500).optional(), position: z.string().max(40).default("home_hero"), isActive: z.boolean().default(true), sortOrder: z.number().default(0) });

export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  return ok(await db.select().from(banners).orderBy(banners.sortOrder));
}
export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;
    const b = schema.parse(await req.json());
    const { id, ...data } = b;
    const row = id ? (await db.update(banners).set(data).where(eq(banners.id, id)).returning())[0] : (await db.insert(banners).values(data).returning())[0];
    revalidateTag("banners", "max");
    revalidatePath("/");
    revalidatePath("/products");
    return ok(row);
  } catch (e) {
    return handleError(e);
  }
}
export async function DELETE(req: Request) {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.delete(banners).where(eq(banners.id, id));
  revalidateTag("banners", "max");
  revalidatePath("/");
  revalidatePath("/products");
  return ok(true);
}
