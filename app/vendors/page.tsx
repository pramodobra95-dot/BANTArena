import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, vendors } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
export const revalidate = 300;
export const metadata: Metadata = { title: "Verified Technology & Telecom Vendors in India", description: "Browse GST-verified telecom, cloud, software and IT solution providers on BANTConfirm.", alternates: { canonical: "/vendors" } };
export default async function VendorsPage() {
  await ensureSeeded();
  const rows = await db.select({ id: vendors.id, companyName: vendors.companyName, slug: vendors.slug, city: vendors.city, state: vendors.state, description: vendors.description, yearsInBusiness: vendors.yearsInBusiness, isFeatured: vendors.isFeatured, productCount: sql<number>`(select count(*)::int from ${products} p where p.vendor_id=${vendors.id} and p.status='approved')` }).from(vendors).where(eq(vendors.status, "verified")).orderBy(desc(vendors.isFeatured), desc(vendors.yearsInBusiness));
  return (
    <main className="container-x py-8">
      <h1 className="text-3xl font-bold">Verified vendors</h1>
      <p className="mt-1 text-slate-500">Every vendor is GST-registered and KYC-checked by our team.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((v) => (
          <Link key={v.id} href={`/vendors/${v.slug}`} className="card p-5 hover:border-brand">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-brand/10 text-xl font-bold text-brand">{v.companyName.charAt(0)}</span>
              <div><p className="font-semibold">{v.companyName}</p><p className="text-xs text-slate-500">{v.city}, {v.state}</p></div>
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{v.description}</p>
            <div className="mt-3 flex gap-2 text-xs"><span className="badge bg-emerald-50 text-emerald-700">✓ Verified</span><span className="badge bg-slate-100">{v.productCount} solutions</span>{v.yearsInBusiness && <span className="badge bg-slate-100">{v.yearsInBusiness}+ yrs</span>}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
