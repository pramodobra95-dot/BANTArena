"use client";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/utils";

export function NotificationsPanel() {
  const [items, setItems] = useState<{ id: number; title: string; body: string | null; isRead: boolean; createdAt: string; link: string | null }[] | null>(null);
  async function load() { const r = await fetch("/api/admin/notifications", { cache: "no-store" }); const d = await r.json(); if (d.ok) setItems(d.data); }
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const unread = items?.filter((i) => !i.isRead).length ?? 0;
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">Notifications {unread > 0 && <span className="badge bg-accent text-white">{unread}</span>}</h3>{unread > 0 && <button className="text-xs text-brand" onClick={async () => { await fetch("/api/admin/notifications", { method: "PATCH" }); load(); }}>Mark all read</button>}</div>
      {!items ? <div className="skeleton h-24" /> : items.length === 0 ? <p className="text-sm text-slate-500">No notifications.</p> : (
        <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">{items.map((n) => <li key={n.id} className={`rounded-lg p-2 ${n.isRead ? "bg-slate-50" : "bg-blue-50"}`}><p className="font-medium">{n.title}</p><p className="text-xs text-slate-600">{n.body}</p><p className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</p></li>)}</ul>
      )}
    </div>
  );
}

export function ActivityFeed() {
  const [items, setItems] = useState<{ id: number; action: string; actor: string | null; meta: Record<string, unknown> | null; createdAt: string }[] | null>(null);
  useEffect(() => { const load = async () => { const r = await fetch("/api/admin/activity", { cache: "no-store" }); const d = await r.json(); if (d.ok) setItems(d.data); }; load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);
  return (
    <div className="card p-4">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">Live activity <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /></h3>
      {!items ? <div className="skeleton h-24" /> : <ul className="max-h-72 space-y-1.5 overflow-y-auto text-sm">{items.map((a) => <li key={a.id} className="flex justify-between gap-2 border-b border-slate-50 py-1"><span><span className="font-mono text-xs text-brand">{a.action}</span> <span className="text-slate-600">{a.actor ?? "system"}{a.meta && "name" in a.meta ? ` · ${String(a.meta.name)}` : a.meta && "product" in a.meta ? ` · ${String(a.meta.product)}` : ""}</span></span><span className="shrink-0 text-xs text-slate-400">{timeAgo(a.createdAt)}</span></li>)}</ul>}
    </div>
  );
}

export function AdminStats() {
  const [s, setS] = useState<Record<string, number> | null>(null);
  useEffect(() => { const load = async () => { const r = await fetch("/api/admin/stats", { cache: "no-store" }); const d = await r.json(); if (d.ok) setS(d.data); }; load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);
  const cards = [["Total leads", s?.leads, `${s?.leads_24h ?? 0} in last 24h`], ["New leads", s?.new_leads, "awaiting contact"], ["Vendors", s?.vendors, `${s?.pending_vendors ?? 0} pending verification`], ["Products", s?.products, `${s?.pending_products ?? 0} pending approval`], ["Users", s?.users, `${s?.users_7d ?? 0} new this week`]];
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map(([l, v, sub]) => <div key={String(l)} className="card p-4">{s ? <p className="text-3xl font-extrabold">{v}</p> : <div className="skeleton h-9 w-16" />}<p className="text-sm font-medium">{l}</p><p className="text-xs text-slate-500">{sub}</p></div>)}
    </div>
  );
}
