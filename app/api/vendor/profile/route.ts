import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

const schema = z.object({
  companyName: z.string().min(2).max(200), description: z.string().max(3000).optional().or(z.literal("")), website: z.string().max(300).optional().or(z.literal("")),
  gstNumber: z.string().max(30).optional().or(z.literal("")), city: z.string().max(100).optional().or(z.literal("")), state: z.string().max(100).optional().or(z.literal("")),
  logoUrl: z.string().max(500).optional().or(z.literal("")), contactEmail: z.string().email().optional().or(z.literal("")), contactPhone: z.string().max(20).optional().or(z.literal("")),
  yearsInBusiness: z.coerce.number().int().min(0).max(100).optional().nullable(),
});

export async function GET() {
  const me = await getCurrentUser();
  if (!me?.vendorId) return fail("Unauthorized", 401);
  return ok(await db.query.vendors.findFirst({ where: eq(vendors.id, me.vendorId) }));
}

export async function PATCH(req: Request) {
  try {
    const me = await getCurrentUser();
    if (!me?.vendorId) return fail("Unauthorized", 401);
    const b = schema.parse(await req.json());
    await db.update(vendors).set({
      companyName: b.companyName, description: b.description || null, website: b.website || null, gstNumber: b.gstNumber || null, city: b.city || null, state: b.state || null,
      logoUrl: b.logoUrl || null, contactEmail: b.contactEmail || null, contactPhone: b.contactPhone || null, yearsInBusiness: b.yearsInBusiness ?? null, updatedAt: new Date(),
    }).where(eq(vendors.id, me.vendorId));
    return ok(true);
  } catch (e) {
    return handleError(e);
  }
}
