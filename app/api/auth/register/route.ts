import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, vendors } from "@/db/schema";
import { createSession, hashPassword, randomToken } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { logActivity, notify } from "@/lib/queries";
import { slugify } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(10).max(20).optional().or(z.literal("")),
  password: z.string().min(8).max(100),
  role: z.enum(["buyer", "vendor"]).default("buyer"),
  company: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  gstNumber: z.string().max(30).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();
    const exists = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (exists) return fail("An account with this email already exists", 409);
    if (body.role === "vendor" && !body.company) return fail("Company name is required for vendors", 422);

    const verifyToken = randomToken(24);
    const [u] = await db
      .insert(users)
      .values({ name: body.name, email, phone: body.phone || null, company: body.company || null, passwordHash: await hashPassword(body.password), role: body.role, verifyToken })
      .returning();

    if (body.role === "vendor") {
      let slug = slugify(body.company!);
      const dup = await db.query.vendors.findFirst({ where: eq(vendors.slug, slug) });
      if (dup) slug = `${slug}-${u.id}`;
      await db.insert(vendors).values({
        userId: u.id, companyName: body.company!, slug, city: body.city || null, state: body.state || null, gstNumber: body.gstNumber || null, website: body.website || null, contactEmail: email, contactPhone: body.phone || null,
      });
      await notify(null, "New vendor registration", `${body.company} registered and awaits verification.`, "/admin/vendors");
    }
    await createSession(u.id);
    await logActivity(u.id, "user.registered", "user", u.id, { role: body.role });
    // Email delivery is simulated: verification link is returned (would be emailed via SMTP provider in production)
    const verifyUrl = `/verify?token=${verifyToken}`;
    return ok({ id: u.id, role: u.role, verifyUrl }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
