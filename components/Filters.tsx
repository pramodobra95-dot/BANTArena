"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Cat = { slug: string; name: string; productCount?: number };

export default function Filters({ categories, hideCategory = false }: { categories: Cat[]; hideCategory?: boolean }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      {!hideCategory && (
        <div className="min-w-[180px] flex-1">
          <label className="label">Category</label>
          <select className="input" value={sp.get("category") ?? ""} onChange={(e) => set("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="min-w-[160px] flex-1">
        <label className="label">Sort by</label>
        <select className="input" value={sp.get("sort") ?? "relevance"} onChange={(e) => set("sort", e.target.value)}>
          <option value="relevance">Relevance</option>
          <option value="popular">Most popular</option>
          <option value="rating">Top rated</option>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>
      <div className="min-w-[140px]">
        <label className="label">Max price (₹)</label>
        <select className="input" value={sp.get("maxPrice") ?? ""} onChange={(e) => set("maxPrice", e.target.value)}>
          <option value="">Any</option>
          <option value="1000">Under 1,000</option>
          <option value="5000">Under 5,000</option>
          <option value="15000">Under 15,000</option>
          <option value="50000">Under 50,000</option>
        </select>
      </div>
      <label className="flex items-center gap-2 pb-2.5 text-sm">
        <input type="checkbox" checked={sp.get("verified") === "true"} onChange={(e) => set("verified", e.target.checked ? "true" : "")} className="h-4 w-4 accent-brand" />
        Verified vendors only
      </label>
      {(sp.get("q") || sp.get("category") || sp.get("maxPrice") || sp.get("verified")) && (
        <button className="btn-ghost pb-2.5 text-brand" onClick={() => router.push(pathname)}>Clear filters</button>
      )}
    </div>
  );
}
