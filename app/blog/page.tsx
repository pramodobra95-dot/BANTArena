import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
export const revalidate = 300;
export const metadata: Metadata = { title: "B2B Technology Insights & Buying Guides", description: "Guides on leased lines, SIP trunks, cloud, CRM and more for Indian businesses.", alternates: { canonical: "/blog" } };
export default async function BlogPage() {
  await ensureSeeded();
  const rows = await db.select({ id: blogs.id, title: blogs.title, slug: blogs.slug, excerpt: blogs.excerpt, coverUrl: blogs.coverUrl, createdAt: blogs.createdAt }).from(blogs).where(eq(blogs.isPublished, true)).orderBy(desc(blogs.createdAt));
  return (
    <main className="container-x py-8">
      <h1 className="text-3xl font-bold">Insights &amp; buying guides</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-3">
        {rows.map((b) => (
          <Link key={b.id} href={`/blog/${b.slug}`} className="card overflow-hidden hover:shadow-md">
            <div className="relative aspect-video bg-slate-100">{b.coverUrl && <Image src={b.coverUrl} alt={b.title} fill sizes="33vw" className="object-cover" />}</div>
            <div className="p-4"><h2 className="font-semibold">{b.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600">{b.excerpt}</p><p className="mt-2 text-xs text-slate-400">{new Date(b.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p></div>
          </Link>
        ))}
        {rows.length === 0 && <p className="text-slate-500">No articles yet.</p>}
      </div>
    </main>
  );
}
