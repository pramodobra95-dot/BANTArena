import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
export const dynamic = "force-dynamic";
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  let okFlag = false;
  if (token) {
    const u = await db.query.users.findFirst({ where: eq(users.verifyToken, token) });
    if (u) { await db.update(users).set({ emailVerified: true, verifyToken: null }).where(eq(users.id, u.id)); okFlag = true; }
  }
  return (
    <main className="container-x py-24 text-center">
      <p className="text-6xl">{okFlag ? "✅" : "❌"}</p>
      <h1 className="mt-4 text-2xl font-bold">{okFlag ? "Email verified" : "Invalid or expired link"}</h1>
      <p className="mt-2 text-slate-600">{okFlag ? "Your account is now fully active." : "Request a new verification link from your dashboard."}</p>
      <Link href="/login" className="btn-primary mt-6">Continue</Link>
    </main>
  );
}
