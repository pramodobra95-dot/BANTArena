import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { logActivity } from "@/lib/queries";
import { ensureSeeded } from "@/lib/seed";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  try {
    await ensureSeeded();
    const { email, password } = schema.parse(await req.json());
    const u = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (!u || !(await verifyPassword(password, u.passwordHash))) return fail("Invalid email or password", 401);
    if (!u.isActive) return fail("Account is suspended. Contact support.", 403);
    await createSession(u.id);
    await logActivity(u.id, "user.login", "user", u.id);
    return ok({ id: u.id, role: u.role, name: u.name });
  } catch (e) {
    return handleError(e);
  }
}
