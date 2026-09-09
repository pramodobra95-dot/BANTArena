import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { fail, ok } from "@/lib/api";
import { getCurrentUser, randomToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { token } = (await req.json()) as { token?: string };
  if (!token) return fail("Token required");
  const u = await db.query.users.findFirst({ where: eq(users.verifyToken, token) });
  if (!u) return fail("Invalid or expired verification link", 404);
  await db.update(users).set({ emailVerified: true, verifyToken: null }).where(eq(users.id, u.id));
  return ok(true);
}

// Re-issue verification link for the logged-in user (simulated email)
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return fail("Unauthorized", 401);
  const token = randomToken(24);
  await db.update(users).set({ verifyToken: token }).where(eq(users.id, me.id));
  return ok({ verifyUrl: `/verify?token=${token}` });
}
