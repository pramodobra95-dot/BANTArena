import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
export const dynamic = "force-dynamic";
export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const r = await db.execute(sql`select
    (select count(*) from users) as users,
    (select count(*) from vendors) as vendors,
    (select count(*) from vendors where status='pending') as pending_vendors,
    (select count(*) from products) as products,
    (select count(*) from products where status='pending') as pending_products,
    (select count(*) from leads) as leads,
    (select count(*) from leads where status='new') as new_leads,
    (select count(*) from leads where created_at > now() - interval '24 hours') as leads_24h,
    (select count(*) from users where created_at > now() - interval '7 days') as users_7d,
    (select count(*) from notifications where user_id is null and is_read=false) as unread`);
  const row = r.rows[0] as Record<string, string>;
  return ok(Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Number(v)])), { headers: { "Cache-Control": "no-store" } });
}
