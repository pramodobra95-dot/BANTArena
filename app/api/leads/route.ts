import { NextRequest } from "next/server";
import { z } from "zod";
import { and, desc, eq, SQL } from "drizzle-orm";
import { db } from "@/db";
import { leads, products, vendors } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { logActivity, notify } from "@/lib/queries";

const schema = z.object({
  productId: z.coerce.number().int().optional().nullable(),
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(10).max(20),
  company: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  quantity: z.string().max(60).optional().or(z.literal("")),
  budget: z.string().max(60).optional().or(z.literal("")),
  timeline: z.string().max(60).optional().or(z.literal("")),
  message: z.string().max(3000).optional().or(z.literal("")),
  source: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const me = await getCurrentUser();
    let vendorId: number | null = null;
    let productName = "General enquiry";
    let vendorUserId: number | null = null;
    if (body.productId) {
      const p = await db.query.products.findFirst({ where: eq(products.id, body.productId), with: { vendor: { columns: { id: true, userId: true } } } });
      if (!p) return fail("Product not found", 404);
      vendorId = p.vendorId;
      productName = p.name;
      vendorUserId = p.vendor.userId;
    }
    const [lead] = await db
      .insert(leads)
      .values({
        productId: body.productId ?? null,
        vendorId,
        buyerUserId: me?.id ?? null,
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        company: body.company || null,
        city: body.city || null,
        quantity: body.quantity || null,
        budget: body.budget || null,
        timeline: body.timeline || null,
        message: body.message || null,
        source: body.source ?? (body.productId ? "product_page" : "contact"),
      })
      .returning({ id: leads.id });
    await Promise.all([
      vendorUserId ? notify(vendorUserId, "New enquiry received", `${body.name} requested a quote for ${productName}`, "/vendor/leads") : Promise.resolve(),
      notify(null, "New lead", `${body.name} – ${productName}`, "/admin/leads"),
      logActivity(me?.id ?? null, "lead.created", "lead", lead.id, { product: productName }),
    ]);
    return ok({ id: lead.id }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return fail("Unauthorized", 401);
  const status = req.nextUrl.searchParams.get("status");
  const conds: SQL[] = [];
  if (me.role === "vendor") {
    if (!me.vendorId) return ok([]);
    conds.push(eq(leads.vendorId, me.vendorId));
  } else if (me.role === "buyer") {
    conds.push(eq(leads.buyerUserId, me.id));
  }
  if (status) conds.push(eq(leads.status, status as typeof leads.status.enumValues[number]));
  const rows = await db
    .select({
      id: leads.id, name: leads.name, email: leads.email, phone: leads.phone, company: leads.company, city: leads.city, quantity: leads.quantity, budget: leads.budget, timeline: leads.timeline, message: leads.message, status: leads.status, source: leads.source, createdAt: leads.createdAt,
      productName: products.name, productSlug: products.slug, vendorName: vendors.companyName,
    })
    .from(leads)
    .leftJoin(products, eq(leads.productId, products.id))
    .leftJoin(vendors, eq(leads.vendorId, vendors.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(200);
  return ok(rows);
}
