import { eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public, immutable image delivery for admin-uploaded banner assets. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("Bad id", { status: 400 });
  const row = await db.query.uploads.findFirst({
    where: eq(uploads.id, id),
    columns: { data: true, mimeType: true, filename: true },
  });
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Length": String(row.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${row.filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
