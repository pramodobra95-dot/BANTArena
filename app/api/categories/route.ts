import { ok } from "@/lib/api";
import { getCategories } from "@/lib/queries";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  await ensureSeeded();
  return ok(await getCategories(), { headers: { "Cache-Control": "public, s-maxage=300" } });
}
