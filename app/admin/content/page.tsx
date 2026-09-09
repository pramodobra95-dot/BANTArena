import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { banners, blogs } from "@/db/schema";
import AdminAction from "@/components/AdminAction";
import { BlogForm } from "@/components/AdminForms";
import BannerManager from "@/components/BannerManager";
import DashboardShell, { requireRole } from "@/components/DashboardShell";
export const dynamic = "force-dynamic";

export default async function Page() {
  const me = await requireRole(["admin"], "/admin/content");
  const [bn, bl] = await Promise.all([
    db.select().from(banners).orderBy(asc(banners.position), asc(banners.sortOrder)),
    db
      .select({ id: blogs.id, title: blogs.title, slug: blogs.slug, isPublished: blogs.isPublished, excerpt: blogs.excerpt, content: blogs.content, coverUrl: blogs.coverUrl, seoKeywords: blogs.seoKeywords })
      .from(blogs)
      .orderBy(desc(blogs.createdAt)),
  ]);
  return (
    <DashboardShell me={me} title="Banners & blogs">
      <div className="mb-3">
        <h2 className="font-semibold">Promotional banners</h2>
        <p className="text-sm text-slate-500">
          Banners with placement <b>Promotional carousel (below catalog)</b> rotate automatically every 5 seconds under the product catalog on the homepage and marketplace.
          Upload a <b>JPEG or PNG</b> image (max 2 MB) or paste an image URL, then set the title, offer text, link, order and active state — the banner shows your image with the text overlaid, and changes go live instantly.
        </p>
      </div>
      <BannerManager initial={bn} />

      <h2 className="mb-3 mt-8 font-semibold">Blog articles</h2>
      <BlogForm />
      <ul className="mt-3 space-y-2">
        {bl.map((b) => (
          <li key={b.id} className="card flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <p className="font-medium">
                {b.title}{" "}
                {b.isPublished ? <span className="badge bg-emerald-100 text-emerald-800">published</span> : <span className="badge bg-slate-100">draft</span>}
              </p>
              <p className="text-xs text-slate-500">/blog/{b.slug}</p>
            </div>
            <div className="flex gap-1">
              <AdminAction
                url="/api/admin/blogs"
                method="POST"
                body={{ id: b.id, title: b.title, excerpt: b.excerpt ?? undefined, content: b.content, coverUrl: b.coverUrl ?? undefined, seoKeywords: b.seoKeywords ?? undefined, isPublished: !b.isPublished }}
                label={b.isPublished ? "Unpublish" : "Publish"}
              />
              <AdminAction url={`/api/admin/blogs?id=${b.id}`} method="DELETE" label="Delete" className="btn-outline py-1 px-2 text-xs text-red-600" confirmText="Delete article?" />
            </div>
          </li>
        ))}
      </ul>
    </DashboardShell>
  );
}
