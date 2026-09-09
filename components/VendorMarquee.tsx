import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, vendors } from "@/db/schema";

const TINTS = [
  "from-brand to-blue-500",
  "from-brand-dark to-brand",
  "from-blue-600 to-brand-deep",
  "from-brand to-accent-deep",
  "from-brand-dark to-blue-500",
];

export default async function VendorMarquee() {
  const rows = await db
    .select({
      id: vendors.id,
      companyName: vendors.companyName,
      slug: vendors.slug,
      logoUrl: vendors.logoUrl,
      productCount: sql<number>`(select count(*)::int from ${products} p where p.vendor_id=${vendors.id} and p.status='approved')`,
    })
    .from(vendors)
    .where(eq(vendors.status, "verified"))
    .orderBy(desc(vendors.isFeatured), desc(vendors.yearsInBusiness))
    .limit(12);

  if (!rows.length) return null;

  const build = (list: typeof rows) =>
    list.map((v, i) => (
      <Link
        key={`${v.id}-${i}`}
        href={`/vendors/${v.slug}`}
        className="mx-2 flex shrink-0 items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
        aria-label={`View ${v.companyName}`}
      >
        {v.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.logoUrl} alt={`${v.companyName} logo`} className="h-8 w-auto max-w-[7rem] object-contain" loading="lazy" />
        ) : (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br text-sm font-black text-white ${TINTS[i % TINTS.length]}`}>
            {v.companyName.charAt(0)}
          </span>
        )}
        <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{v.companyName}</span>
      </Link>
    ));

  const reps = Math.max(1, Math.ceil(10 / rows.length));
  const half = build(Array.from({ length: reps }).flatMap(() => rows));

  return (
    <div className="marquee marquee-mask overflow-hidden py-2" role="region" aria-label="Trusted technology partners">
      <div className="marquee-track" style={{ ["--marquee-speed" as string]: `${Math.max(28, rows.length * 3.4)}s` }}>
        <div className="flex shrink-0 items-center">{half}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {half}
        </div>
      </div>
    </div>
  );
}
