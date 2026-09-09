"use client";
import { useEffect, useState } from "react";
import { LEAD_STATUSES, timeAgo } from "@/lib/utils";

type Lead = { id: number; name: string; email: string; phone: string; company: string | null; city: string | null; quantity: string | null; budget: string | null; timeline: string | null; message: string | null; status: string; source: string; createdAt: string; productName: string | null; productSlug: string | null; vendorName: string | null };
type Note = { id: number; note: string; authorRole: string; createdAt: string };

const COLORS: Record<string, string> = { new: "bg-blue-100 text-blue-800", contacted: "bg-amber-100 text-amber-800", qualified: "bg-violet-100 text-violet-800", proposal: "bg-cyan-100 text-cyan-800", won: "bg-emerald-100 text-emerald-800", lost: "bg-slate-200 text-slate-700" };

export default function LeadsManager({ canManage, poll = false }: { canManage: boolean; poll?: boolean }) {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    try {
      const r = await fetch(`/api/leads${filter ? `?status=${filter}` : ""}`, { cache: "no-store" });
      const d = await r.json();
      if (d.ok) setLeads(d.data); else setErr(d.error);
    } catch { setErr("Failed to load leads"); }
  }
  useEffect(() => { load(); if (!poll) return; const t = setInterval(load, 15000); return () => clearInterval(t); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openLead(id: number) {
    setOpenId(openId === id ? null : id);
    if (openId !== id) { const r = await fetch(`/api/leads/${id}/notes`); const d = await r.json(); setNotes(d.ok ? d.data : []); }
  }
  async function setStatus(id: number, status: string) {
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, status } : l)) ?? null);
  }
  async function addNote(id: number) {
    if (!noteText.trim()) return;
    const r = await fetch(`/api/leads/${id}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: noteText }) });
    const d = await r.json();
    if (d.ok) { setNotes((n) => [...n, d.data]); setNoteText(""); }
  }

  if (err) return <div className="card p-8 text-center text-red-600">{err}</div>;
  if (!leads) return <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-20" />)}</div>;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("")} className={`badge cursor-pointer ${!filter ? "bg-brand text-white" : "bg-white ring-1 ring-slate-200"}`}>All</button>
        {LEAD_STATUSES.map((s) => <button key={s} onClick={() => setFilter(s)} className={`badge cursor-pointer capitalize ${filter === s ? "bg-brand text-white" : "bg-white ring-1 ring-slate-200"}`}>{s}</button>)}
        {poll && <span className="ml-auto flex items-center gap-1 text-xs text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live</span>}
      </div>
      {leads.length === 0 && <div className="card p-12 text-center"><p className="text-4xl">📭</p><p className="mt-2 font-semibold">No enquiries yet</p><p className="text-sm text-slate-500">New leads will appear here in real time.</p></div>}
      <div className="space-y-3">
        {leads.map((l) => (
          <div key={l.id} className="card overflow-hidden">
            <button onClick={() => openLead(l.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{l.name}{l.company && <span className="font-normal text-slate-500"> · {l.company}</span>}</p>
                <p className="truncate text-sm text-slate-600">{l.productName ?? "General enquiry"}{l.vendorName && !canManage ? ` · ${l.vendorName}` : ""}</p>
              </div>
              <div className="hidden text-xs text-slate-500 sm:block">{l.budget && <span>💰 {l.budget} · </span>}{l.timeline && <span>⏱ {l.timeline}</span>}</div>
              <span className={`badge capitalize ${COLORS[l.status]}`}>{l.status}</span>
              <span className="text-xs text-slate-400">{timeAgo(l.createdAt)}</span>
            </button>
            {openId === l.id && (
              <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-4 md:grid-cols-2">
                <div className="text-sm">
                  <p><span className="text-slate-500">Email:</span> <a href={`mailto:${l.email}`} className="text-brand">{l.email}</a></p>
                  <p><span className="text-slate-500">Phone:</span> <a href={`tel:${l.phone}`} className="text-brand">{l.phone}</a></p>
                  {l.city && <p><span className="text-slate-500">City:</span> {l.city}</p>}
                  {l.quantity && <p><span className="text-slate-500">Quantity:</span> {l.quantity}</p>}
                  {l.budget && <p><span className="text-slate-500">Budget:</span> {l.budget}</p>}
                  {l.timeline && <p><span className="text-slate-500">Timeline:</span> {l.timeline}</p>}
                  {l.message && <p className="mt-2 rounded bg-white p-2 text-slate-700">{l.message}</p>}
                  {canManage && (
                    <div className="mt-3"><label className="label">Update status</label>
                      <select className="input" value={l.status} onChange={(e) => setStatus(l.id, e.target.value)}>{LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">Follow-ups &amp; communication</p>
                  <ul className="mt-2 max-h-48 space-y-2 overflow-y-auto text-sm">
                    {notes.length === 0 && <li className="text-slate-500">No notes yet.</li>}
                    {notes.map((n) => <li key={n.id} className="rounded bg-white p-2"><span className="badge mr-1 bg-slate-100 capitalize">{n.authorRole}</span>{n.note}<span className="ml-2 text-xs text-slate-400">{timeAgo(n.createdAt)}</span></li>)}
                  </ul>
                  <div className="mt-2 flex gap-2"><input value={noteText} onChange={(e) => setNoteText(e.target.value)} className="input" placeholder="Add a note / message…" /><button onClick={() => addNote(l.id)} className="btn-primary">Send</button></div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
