"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Override = { path: string; title: string | null; description: string | null; h1: string | null; keywords: string | null; canonical: string | null; ogTitle: string | null; ogDescription: string | null; ogImage: string | null; noindex: boolean; inSitemap: boolean; seoContent: string | null; altText: string | null };
type Redirect = { id: number; fromPath: string; toPath: string; statusCode: number; isActive: boolean };

const EMPTY = { path: "", title: "", description: "", h1: "", keywords: "", canonical: "", ogTitle: "", ogDescription: "", ogImage: "", noindex: false, inSitemap: true, seoContent: "", altText: "" };

export function SeoOverridesManager({ initial, suggestions }: { initial: Override[]; suggestions: string[] }) {
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const set = (k: keyof typeof EMPTY, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function reload() {
    const r = await fetch("/api/admin/seo", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setRows(d.data);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const r = await fetch("/api/admin/seo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setBusy(false);
    setMsg(d.ok ? `Saved SEO rules for ${form.path}` : d.error);
    if (d.ok) { await reload(); router.refresh(); }
  }
  async function remove(path: string) {
    if (!confirm(`Remove SEO override for ${path}?`)) return;
    await fetch(`/api/admin/seo?path=${encodeURIComponent(path)}`, { method: "DELETE" });
    await reload();
    router.refresh();
  }
  const fields: [keyof typeof EMPTY, string, string][] = [
    ["title", "Meta title", "60 chars ideal"],
    ["description", "Meta description", "155 chars ideal"],
    ["h1", "H1 override", ""],
    ["keywords", "Keywords (comma separated)", ""],
    ["canonical", "Canonical URL override", ""],
    ["ogTitle", "Open Graph title", ""],
    ["ogDescription", "Open Graph description", ""],
    ["ogImage", "OG image URL", ""],
    ["altText", "Image alt text", ""],
  ];

  return (
    <div>
      <form onSubmit={save} className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="label">Page path *</label>
            <input list="seo-paths" required className="input" value={form.path} onChange={(e) => set("path", e.target.value)} placeholder="/products/sip-trunk-for-ai-agents-contact-centres" />
            <datalist id="seo-paths">{suggestions.map((s) => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="flex items-end gap-3 pb-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={form.noindex} onChange={(e) => set("noindex", e.target.checked)} /> noindex</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={form.inSitemap} onChange={(e) => set("inSitemap", e.target.checked)} /> in sitemap</label>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(([k, label, hint]) => (
            <div key={k}>
              <label className="label">{label}{hint && <span className="ml-1 normal-case text-slate-400">({hint})</span>}</label>
              <input className="input" value={String(form[k] ?? "")} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
        </div>
        <div>
          <label className="label">Extra SEO content (natural copy rendered on the page)</label>
          <textarea rows={3} className="input" value={form.seoContent} onChange={(e) => set("seoContent", e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button disabled={busy} className="btn-primary">{busy ? "Saving…" : "Save SEO rules"}</button>
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      </form>

      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <li className="card p-5 text-center text-sm text-slate-500">No overrides yet — pages use their auto-generated SEO.</li>}
        {rows.map((r) => (
          <li key={r.path} className="card p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-xs text-brand">{r.path}</p>
              <div className="flex gap-1">
                <button className="btn-outline py-1 px-2 text-xs" onClick={() => { setForm({ path: r.path, title: r.title ?? "", description: r.description ?? "", h1: r.h1 ?? "", keywords: r.keywords ?? "", canonical: r.canonical ?? "", ogTitle: r.ogTitle ?? "", ogDescription: r.ogDescription ?? "", ogImage: r.ogImage ?? "", noindex: r.noindex, inSitemap: r.inSitemap, seoContent: r.seoContent ?? "", altText: r.altText ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                <button className="btn-outline py-1 px-2 text-xs text-red-600" onClick={() => remove(r.path)}>Remove</button>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-600">{r.title ?? <span className="text-slate-400">title: auto</span>}</p>
            <p className="text-xs text-slate-500">{r.description?.slice(0, 120)}</p>
            <div className="mt-1 flex gap-2 text-[10px]">
              {r.noindex && <span className="badge bg-red-100 text-red-700">noindex</span>}
              {!r.inSitemap && <span className="badge bg-slate-100">excluded from sitemap</span>}
              {r.h1 && <span className="badge bg-brand/10 text-brand">H1 override</span>}
              {r.canonical && <span className="badge bg-brand/10 text-brand">canonical override</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RedirectsManager({ initial }: { initial: Redirect[] }) {
  const [rows, setRows] = useState(initial);
  const [form, setForm] = useState({ fromPath: "", toPath: "", statusCode: 301, isActive: true });
  const [msg, setMsg] = useState("");
  const router = useRouter();
  async function reload() {
    const r = await fetch("/api/admin/redirects", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setRows(d.data);
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/admin/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await r.json();
    setMsg(d.ok ? "Redirect saved." : d.error);
    if (d.ok) { setForm({ fromPath: "", toPath: "", statusCode: 301, isActive: true }); await reload(); router.refresh(); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this redirect?")) return;
    await fetch(`/api/admin/redirects?id=${id}`, { method: "DELETE" });
    await reload();
    router.refresh();
  }
  return (
    <div>
      <form onSubmit={save} className="card grid gap-3 p-4 sm:grid-cols-4">
        <div><label className="label">From path *</label><input required className="input" value={form.fromPath} onChange={(e) => setForm({ ...form, fromPath: e.target.value })} placeholder="/products/old-slug" /></div>
        <div><label className="label">To path *</label><input required className="input" value={form.toPath} onChange={(e) => setForm({ ...form, toPath: e.target.value })} placeholder="/products/new-slug" /></div>
        <div><label className="label">Status</label><select className="input" value={form.statusCode} onChange={(e) => setForm({ ...form, statusCode: Number(e.target.value) })}><option value={301}>301 permanent</option><option value={302}>302 temporary</option></select></div>
        <div className="flex items-end gap-3 pb-1"><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label><button className="btn-primary">Save</button></div>
        {msg && <p className="text-xs text-slate-500 sm:col-span-4">{msg}</p>}
      </form>
      <ul className="mt-3 space-y-2">
        {rows.length === 0 && <li className="card p-5 text-center text-sm text-slate-500">No redirects configured.</li>}
        {rows.map((r) => (
          <li key={r.id} className="card flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
            <p className="font-mono text-xs"><span className="text-slate-500">{r.fromPath}</span> → <span className="text-brand">{r.toPath}</span> <span className="badge bg-accent/30 text-brand-dark">{r.statusCode}</span> {!r.isActive && <span className="badge bg-slate-100">inactive</span>}</p>
            <div className="flex gap-1">
              <button className="btn-outline py-1 px-2 text-xs" onClick={async () => { await fetch("/api/admin/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, fromPath: r.fromPath, toPath: r.toPath, statusCode: r.statusCode, isActive: !r.isActive }) }); await reload(); router.refresh(); }}>{r.isActive ? "Disable" : "Enable"}</button>
              <button className="btn-outline py-1 px-2 text-xs text-red-600" onClick={() => remove(r.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
