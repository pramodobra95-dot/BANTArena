"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type { ProductCard as P } from "@/lib/queries";

type Props = {
  initial?: { items: P[]; hasMore: boolean; total: number };
  params: Record<string, string | undefined>;
  limit?: number;
  emptyTitle?: string;
};

export default function ProductGrid({ initial, params, limit = 12, emptyTitle = "No solutions found" }: Props) {
  const [items, setItems] = useState<P[]>(initial?.items ?? []);
  const [hasMore, setHasMore] = useState(initial?.hasMore ?? true);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(params);
  const firstKey = useRef(key);

  const fetchPage = useCallback(
    async (p: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(p), limit: String(limit) } as Record<string, string>);
        const r = await fetch(`/api/products?${qs}`);
        const d = await r.json();
        if (!d.ok) throw new Error(d.error);
        setItems((prev) => (replace ? d.data.items : [...prev, ...d.data.items]));
        setHasMore(d.data.hasMore);
        setTotal(d.data.total);
        setPage(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [key, limit] // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (initial && key === firstKey.current) return;
    fetchPage(1, true);
  }, [key, fetchPage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && items.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl">⚠️</p>
        <p className="mt-2 font-semibold">Could not load products</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button className="btn-primary mt-4" onClick={() => fetchPage(1, true)}>Retry</button>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-5xl">🗂️</p>
        <h3 className="mt-3 text-lg font-semibold">{emptyTitle}</h3>
        <p className="mt-1 text-sm text-slate-500">Try a different keyword such as “leased line”, “SIP trunk” or “CRM”.</p>
      </div>
    );
  }

  return (
    <div>
      {total > 0 && <p className="mb-3 text-sm text-slate-500">Showing {items.length} of {total} solutions</p>}
      <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p, i) => (
          <ProductCard key={p.id} p={p} priority={i < 4} />
        ))}
        {loading && Array.from({ length: items.length ? 4 : 8 }).map((_, i) => <ProductCardSkeleton key={`s${i}`} />)}
      </div>
      {hasMore && !loading && (
        <div className="mt-8 text-center">
          <button className="btn-accent px-10 py-3 text-base" onClick={() => fetchPage(page + 1, false)}>
            Show more solutions
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
