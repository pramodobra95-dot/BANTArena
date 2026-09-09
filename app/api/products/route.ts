import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { listProducts } from "@/lib/queries";
import { ensureSeeded } from "@/lib/seed";

const schema = z.object({
  q: z.string().max(200).optional(),
  category: z.string().max(140).optional(),
  sort: z.enum(["relevance", "newest", "rating", "price_asc", "price_desc", "popular"]).optional(),
  featured: z.coerce.boolean().optional(),
  popular: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(48).optional(),
});

export async function GET(req: NextRequest) {
  const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return fail("Invalid query", 422);
  await ensureSeeded();
  const p = parsed.data;
  const data = await listProducts({ ...p, verifiedOnly: p.verified });
  return ok(data, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
