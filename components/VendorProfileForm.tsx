"use client";
import { useEffect, useState } from "react";
type V = Record<string, string | number | null>;
const FIELDS: [string, string][] = [["companyName", "Company name *"], ["website", "Website"], ["gstNumber", "GST number"], ["yearsInBusiness", "Years in business"], ["city", "City"], ["state", "State"], ["contactEmail", "Sales email"], ["contactPhone", "Sales phone"], ["logoUrl", "Logo URL"]];
export default function VendorProfileForm() {
  const [v, setV] = useState<V | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => { fetch("/api/vendor/profile").then((r) => r.json()).then((d) => setV(d.data)); }, []);
  if (!v) return <div className="skeleton h-64" />;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/vendor/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = await r.json();
    setMsg(d.ok ? "Profile saved." : d.error);
  }
  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <div className="rounded-lg bg-slate-50 p-3 text-sm">Verification status: <span className="badge bg-brand/10 capitalize text-brand">{String(v.status)}</span>{v.status === "pending" && <span className="ml-2 text-slate-500">Our team verifies GST/KYC within 1–2 business days.</span>}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(([k, l]) => <div key={k}><label className="label">{l}</label><input className="input" required={k === "companyName"} value={v[k] == null ? "" : String(v[k])} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>)}
        <div className="sm:col-span-2"><label className="label">About the company</label><textarea className="input" rows={4} value={v.description == null ? "" : String(v.description)} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button className="btn-primary">Save profile</button>
    </form>
  );
}
