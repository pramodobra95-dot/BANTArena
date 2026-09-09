"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Banner = {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  seoKeywords: string | null;
  position: string;
  isActive: boolean;
  sortOrder: number;
};

type Upload = { id: number; url: string; filename: string; mimeType: string; sizeBytes: number };

const POSITIONS: [string, string][] = [
  ["promo", "Promotional carousel (below catalog) — displayed"],
  ["home_hero", "Home hero — reserved, not displayed"],
  ["home_mid", "Home mid section — reserved, not displayed"],
  ["category_top", "Category page top — reserved, not displayed"],
];

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];
const EMPTY = { title: "", subtitle: "", imageUrl: "", linkUrl: "", altText: "", seoKeywords: "", position: "promo", sortOrder: 0, isActive: true };

export default function BannerManager({ initial }: { initial: Banner[] }) {
  const [rows, setRows] = useState<Banner[]>(initial);
  const [form, setForm] = useState<{ id?: number } & typeof EMPTY>(EMPTY);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadOk, setUploadOk] = useState(true);
  const [recent, setRecent] = useState<Upload[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function reload() {
    const r = await fetch("/api/admin/banners", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setRows(d.data);
  }

  async function loadUploads() {
    const r = await fetch("/api/uploads", { cache: "no-store" });
    const d = await r.json();
    if (d.ok) setRecent(d.data);
  }

  useEffect(() => {
    loadUploads();
  }, []);

  /** Upload a JPEG/PNG file and use the returned URL as the banner image. */
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;

    if (!ACCEPTED.includes(file.type)) {
      setUploadOk(false);
      setUploadMsg(`Unsupported format “${file.type || "unknown"}”. Please choose a JPEG (.jpg/.jpeg) or PNG (.png) image.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadOk(false);
      setUploadMsg(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 2 MB.`);
      return;
    }

    setUploading(true);
    setUploadOk(true);
    setUploadMsg(`Uploading ${file.name}…`);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/uploads", { method: "POST", body: fd });
      const d = await r.json();
      if (d.ok) {
        setForm((f) => ({ ...f, imageUrl: d.data.url }));
        setUploadMsg(`Uploaded ${d.data.filename} (${Math.round(d.data.sizeBytes / 1024)} KB) ✓ — image attached to this banner.`);
        loadUploads();
      } else {
        setUploadOk(false);
        setUploadMsg(d.error ?? "Upload failed. Please try again.");
      }
    } catch {
      setUploadOk(false);
      setUploadMsg("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const r = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, subtitle: form.subtitle || undefined, imageUrl: form.imageUrl || undefined, linkUrl: form.linkUrl || undefined, altText: form.altText || undefined, seoKeywords: form.seoKeywords || undefined }),
    });
    const d = await r.json();
    setBusy(false);
    setMsg(d.ok ? (form.id ? "Banner updated." : "Banner added.") : d.error);
    if (d.ok) {
      setForm(EMPTY);
      setUploadMsg("");
      await reload();
      router.refresh();
    }
  }

  async function patch(b: Banner, changes: Partial<Banner>) {
    const r = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle ?? undefined,
        imageUrl: b.imageUrl ?? undefined,
        linkUrl: b.linkUrl ?? undefined,
        altText: b.altText ?? undefined,
        seoKeywords: b.seoKeywords ?? undefined,
        position: b.position,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
        ...changes,
      }),
    });
    const d = await r.json();
    setMsg(d.ok ? "Saved." : d.error);
    if (d.ok) {
      await reload();
      router.refresh();
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this banner?")) return;
    const r = await fetch(`/api/admin/banners?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    setMsg(d.ok ? "Banner deleted." : d.error);
    if (d.ok) {
      await reload();
      router.refresh();
    }
  }

  const set = (k: keyof typeof EMPTY, v: string | number | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <form onSubmit={save} className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <label className="label">Banner title *</label>
          <input required className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Post your requirement & earn 10% rewards" />
        </div>
        <div>
          <label className="label">Placement</label>
          <select className="input" value={form.position} onChange={(e) => set("position", e.target.value)}>
            {POSITIONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* ---------- image upload ---------- */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label">Banner image — upload JPEG / PNG</label>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onFile} />
            <button type="button" className="btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "📷 Upload image"}
            </button>
            <div className="text-[11px] leading-relaxed text-slate-500">
              <p>
                Allowed formats: <b className="text-slate-700">JPEG</b> and <b className="text-slate-700">PNG</b> · max 2 MB · recommended 21:9 (e.g. 1600×680).
              </p>
              <p>The banner displays your image with the title, offer text and button overlaid on it.</p>
            </div>
            {form.imageUrl && (
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Preview</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.imageUrl} alt="Banner preview" className="h-16 w-32 rounded-lg object-cover ring-1 ring-slate-200" />
              </div>
            )}
          </div>
          {uploadMsg && <p className={`mt-1 text-[11px] ${uploadOk ? "text-emerald-700" : "text-red-600"}`}>{uploadMsg}</p>}
          <input
            className="input mt-2"
            value={form.imageUrl}
            onChange={(e) => set("imageUrl", e.target.value)}
            placeholder="…or paste an existing image URL (/images/promo-rewards.jpg or https://…)"
          />
          {recent.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Recently uploaded — click to reuse</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    title={`${r.filename} · ${r.mimeType} · ${Math.round(r.sizeBytes / 1024)} KB`}
                    onClick={() => {
                      set("imageUrl", r.url);
                      setUploadOk(true);
                      setUploadMsg(`Using ${r.filename}`);
                    }}
                    className={`h-12 w-20 overflow-hidden rounded-md ring-1 transition hover:ring-accent ${form.imageUrl === r.url ? "ring-2 ring-brand" : "ring-slate-200"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.url} alt={r.filename} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="label">Subtitle / offer text</label>
          <input className="input" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} placeholder="Short line shown under the title" />
        </div>
        <div>
          <label className="label">Sort order</label>
          <input type="number" className="input" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Image alt text (SEO)</label>
          <input className="input" value={form.altText} onChange={(e) => set("altText", e.target.value)} placeholder="Business technology promotion banner" />
        </div>
        <div>
          <label className="label">Campaign keywords</label>
          <input className="input" value={form.seoKeywords} onChange={(e) => set("seoKeywords", e.target.value)} placeholder="internet leased line, sip trunk" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Click-through link</label>
          <input className="input" value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} placeholder="/products?q=mpls" />
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-brand" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Active
          </label>
          <button disabled={busy} className="btn-accent">{busy ? "Saving…" : form.id ? "Update banner" : "Add banner"}</button>
          {form.id && (
            <button type="button" className="btn-ghost" onClick={() => { setForm(EMPTY); setMsg(""); setUploadMsg(""); }}>
              Cancel edit
            </button>
          )}
          {msg && <span className="text-xs text-slate-500">{msg}</span>}
        </div>
      </form>

      <ul className="mt-3 space-y-2">
        {rows.length === 0 && (
          <li className="card p-6 text-center text-sm text-slate-500">
            No banners yet. Add one above — “Promotional carousel” banners rotate every 5 seconds below the catalog.
          </li>
        )}
        {rows.map((b) => (
          <li key={b.id} className="card flex flex-wrap items-center gap-3 p-3">
            <div className="relative h-14 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center px-1 text-center text-[10px] text-slate-400">no image</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {b.title} <span className="badge bg-brand/10 text-brand">{POSITIONS.find((p) => p[0] === b.position)?.[1] ?? b.position}</span>{" "}
                {!b.isActive && <span className="badge bg-red-100 text-red-700">inactive</span>}
              </p>
              <p className="truncate text-xs text-slate-500">
                #{b.sortOrder} · {b.subtitle || "no subtitle"} {b.linkUrl ? `→ ${b.linkUrl}` : ""}
              </p>
              {b.imageUrl?.startsWith("/api/uploads/") && <p className="text-[10px] text-emerald-700">uploaded image</p>}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                className="btn-outline py-1 px-2 text-xs"
                onClick={() => {
                  setForm({
                    id: b.id,
                    title: b.title,
                    subtitle: b.subtitle ?? "",
                    imageUrl: b.imageUrl ?? "",
                    linkUrl: b.linkUrl ?? "",
                    altText: b.altText ?? "",
                    seoKeywords: b.seoKeywords ?? "",
                    position: b.position,
                    sortOrder: b.sortOrder,
                    isActive: b.isActive,
                  });
                  setUploadMsg(b.imageUrl ? `Current image: ${b.imageUrl}` : "No image yet — upload a JPEG or PNG.");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Edit
              </button>
              <button className="btn-outline py-1 px-2 text-xs" onClick={() => patch(b, { isActive: !b.isActive })}>
                {b.isActive ? "Deactivate" : "Activate"}
              </button>
              <button className="btn-outline py-1 px-2 text-xs" onClick={() => patch(b, { sortOrder: b.sortOrder + 1 })} title="Move later in rotation">
                ↓ Order
              </button>
              <button className="btn-outline py-1 px-2 text-xs text-red-600" onClick={() => remove(b.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
