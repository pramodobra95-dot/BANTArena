"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatINR } from "@/lib/utils";
type Row = { id: number; name: string; slug: string; status: string; priceFrom: string | null; priceUnit: string | null; viewCount: number; ratingAvg: string; categoryName: string; isFeatured: boolean };
const C: Record<string, string> = { approved: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800", rejected: "bg-red-100 text-red-800", draft: "bg-slate-100" };
export default function VendorProductsTable() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = () => fetch("/api/vendor/products", { cache: "no-store" }).then((r) => r.json()).then((d) => setRows(d.data ?? []));
  useEffect(() => { load(); }, []);
  async function del(id: number) { if (!confirm("Delete this product?")) return; await fetch(`/api/vendor/products/${id}`, { method: "DELETE" }); load(); }
  if (!rows) return <div className="skeleton h-40" />;
  if (rows.length === 0) return <div className="card p-12 text-center"><p className="text-4xl">📦</p><p className="mt-2 font-semibold">No products yet</p><Link href="/vendor/products/new" className="btn-primary mt-4">Add your first product</Link></div>;
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Product</th><th className="p-3">Category</th><th className="p-3">Price</th><th className="p-3">Views</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id} className="border-t border-slate-100">
            <td className="p-3 font-medium">{r.name}{r.isFeatured && <span className="badge ml-2 bg-accent text-white">Featured</span>}</td>
            <td className="p-3 text-slate-600">{r.categoryName}</td>
            <td className="p-3">{formatINR(r.priceFrom) ?? "Custom"}</td>
            <td className="p-3">{r.viewCount}</td>
            <td className="p-3"><span className={`badge capitalize ${C[r.status]}`}>{r.status}</span></td>
            <td className="p-3 text-right whitespace-nowrap"><Link href={`/vendor/products/${r.id}`} className="text-brand">Edit</Link> · {r.status === "approved" && <><Link href={`/products/${r.slug}`} className="text-brand">View</Link> · </>}<button onClick={() => del(r.id)} className="text-red-600">Delete</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
