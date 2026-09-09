import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, reviews } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({ productId: z.number().int(), rating: z.number().int().min(1).max(5), title: z.string().max(200).optional(), body: z.string().max(2000).optional() });

export async function POST(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me) return fail("Please login to post a review", 401);
    const b = schema.parse(await req.json());
    await db.insert(reviews).values({ productId: b.productId, userId: me.id, authorName: me.name, rating: b.rating, title: b.title, body: b.body });
    await db.execute(sql`update ${products} set rating_avg = (select round(avg(rating)::numeric,2) from ${reviews} where product_id = ${b.productId} and is_approved), rating_count = (select count(*) from ${reviews} where product_id = ${b.productId} and is_approved) where id = ${b.productId}`);
    return ok(true, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("productId"));
  if (!id) return fail("productId required");
  return ok(await db.select().from(reviews).where(eq(reviews.productId, id)));
}
