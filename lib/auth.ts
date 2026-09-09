import { cookies } from "next/headers";
import { cache } from "react";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, vendors } from "@/db/schema";

export const SESSION_COOKIE = "bant_session";
const SESSION_DAYS = 14;

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export async function createSession(userId: number) {
  const id = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000);
  await db.insert(sessions).values({ id, userId, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return id;
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) await db.delete(sessions).where(eq(sessions.id, id));
  store.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "buyer" | "vendor" | "admin";
  emailVerified: boolean;
  company: string | null;
  phone: string | null;
  vendorId: number | null;
  vendorStatus: string | null;
  vendorName: string | null;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
      company: users.company,
      phone: users.phone,
      isActive: users.isActive,
      vendorId: vendors.id,
      vendorStatus: vendors.status,
      vendorName: vendors.companyName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .leftJoin(vendors, eq(vendors.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.isActive) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.emailVerified,
    company: row.company,
    phone: row.phone,
    vendorId: row.vendorId ?? null,
    vendorStatus: row.vendorStatus ?? null,
    vendorName: row.vendorName ?? null,
  };
});

export async function requireUser(roles?: SessionUser["role"][]) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}
