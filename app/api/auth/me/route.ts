import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";
export const dynamic = "force-dynamic";
export async function GET() {
  const u = await getCurrentUser();
  return ok(u, { headers: { "Cache-Control": "no-store" } });
}
