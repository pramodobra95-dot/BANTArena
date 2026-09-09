import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { fail, handleError, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png" };

/** Admin-only image upload (JPEG / PNG). Stored in Postgres and served from /api/uploads/:id */
export async function POST(req: Request) {
  try {
    const a = await requireAdmin();
    if ("error" in a) return a.error;

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("No file was uploaded. Choose a JPEG or PNG image.", 422);

    const ext = ALLOWED[file.type];
    if (!ext) return fail(`Unsupported format “${file.type || "unknown"}”. Only JPEG (.jpg/.jpeg) and PNG (.png) are allowed.`, 415);
    if (file.size === 0) return fail("The selected file is empty.", 422);
    if (file.size > MAX_BYTES) return fail(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`, 413);

    // verify magic bytes so a renamed file cannot bypass the format check
    const buf = Buffer.from(await file.arrayBuffer());
    const isJpeg = buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isPng = buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    if ((file.type === "image/jpeg" && !isJpeg) || (file.type === "image/png" && !isPng)) {
      return fail("File content does not match a valid JPEG or PNG image.", 415);
    }

    const filename = (file.name || `upload${ext}`).replace(/[^\w.\-]+/g, "_").slice(-160);
    const [row] = await db
      .insert(uploads)
      .values({ filename, mimeType: file.type, sizeBytes: buf.length, data: buf, uploadedBy: a.me.id })
      .returning({ id: uploads.id });

    return ok(
      { id: row.id, url: `/api/uploads/${row.id}`, filename, mimeType: file.type, sizeBytes: buf.length },
      { status: 201 }
    );
  } catch (e) {
    return handleError(e);
  }
}

/** Recent uploads – lets admins reuse an image without re-uploading. */
export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return a.error;
  const rows = await db
    .select({ id: uploads.id, filename: uploads.filename, mimeType: uploads.mimeType, sizeBytes: uploads.sizeBytes, createdAt: uploads.createdAt })
    .from(uploads)
    .orderBy(desc(uploads.createdAt))
    .limit(24);
  return ok(rows.map((r) => ({ ...r, url: `/api/uploads/${r.id}` })));
}
