import Image from "next/image";
import Link from "next/link";
import type { ProductCard as P } from "@/lib/queries";
import { formatINR } from "@/lib/utils";
import SaveButton from "./SaveButton";

export function Stars({ value, count }: { value: number | string; count?: number }) {
  const v = typeof value === "string" ? parseFloat(value) : value;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <span className="text-accent" aria-label={`${v} out of 5`}>
        {"★".repeat(Math.round(v))}
        <span className="text-slate-300">{"★".repeat(5 - Math.round(v))}</span>
      </span>
      {v > 0 && <span className="font-medium text-slate-800">{v.toFixed(1)}</span>}
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}

export default function ProductCard({ p, priority = false }: { p: P; priority?: boolean }) {
  const price = formatINR(p.priceFrom);
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/70 hover:shadow-[0_18px_40px_-12px_rgba(15,61,145,0.25)]">
      <Link href={`/products/${p.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-slate-100">
        {p.imageUrl ? (
          <Image src={p.imageUrl} alt={p.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-110" priority={priority} loading={priority ? undefined : "lazy"} />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-4xl text-white">📦</div>
        )}
        {/* bottom brand tint on hover */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-dark/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>
      <SaveButton productId={p.id} />
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {p.isFeatured && <span className="badge bg-accent text-brand-dark shadow-sm">★ Featured</span>}
        {p.vendorVerified && <span className="badge bg-brand text-white shadow-sm">✓ Verified</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/categories/${p.categorySlug}`} className="text-[11px] font-bold uppercase tracking-wide text-brand transition hover:text-accent-deep">
          {p.categoryName}
        </Link>
        <Link href={`/products/${p.slug}`} className="mt-1 line-clamp-2 font-semibold leading-snug text-slate-900 transition group-hover:text-brand">
          {p.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.shortDescription}</p>
        <div className="mt-3"><Stars value={p.ratingAvg} count={p.ratingCount} /></div>
        <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-[11px] text-slate-500">Starting at</p>
            <p className="font-bold text-slate-900">
              {price ?? "Custom quote"} {price && p.priceUnit && <span className="text-xs font-normal text-slate-500">/ {p.priceUnit}</span>}
            </p>
          </div>
          <Link href={`/products/${p.slug}#enquire`} className="btn-primary px-3 py-1.5 text-xs transition hover:bg-brand-dark active:scale-95">
            Get Quote
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="shimmer aspect-[16/10] w-full rounded-none bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-3 w-1/4" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton mt-3 h-8 w-full" />
      </div>
    </div>
  );
}
