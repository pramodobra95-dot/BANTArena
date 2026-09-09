import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leadNotes, leads } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";

async function authorize(id: number) {
  const me = await getCurrentUser();
  if (!me) return { error: fail("Unauthorized", 401) };
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) });
  if (!lead) return { error: fail("Lead not found", 404) };
  const allowed = me.role === "admin" || (me.role === "vendor" && lead.vendorId === me.vendorId) || (me.role === "buyer" && lead.buyerUserId === me.id);
  if (!allowed) return { error: fail("Forbidden", 403) };
  return { me, lead };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const a = await authorize(id);
  if ("error" in a) return a.error;
  return ok(await db.select().from(leadNotes).where(eq(leadNotes.leadId, id)).orderBy(asc(leadNotes.createdAt)));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = Number((await params).id);
    const a = await authorize(id);
    if ("error" in a) return a.error;
    const { note } = z.object({ note: z.string().min(1).max(2000) }).parse(await req.json());
    const [n] = await db.insert(leadNotes).values({ leadId: id, authorId: a.me.id, authorRole: a.me.role, note }).returning();
    return ok(n, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
