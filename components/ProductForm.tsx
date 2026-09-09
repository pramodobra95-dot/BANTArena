"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProductInput } from "@/lib/product-schema";

type Cat = { id: number; name: string };
const empty: ProductInput = { name: "", categoryId: 0, shortDescription: "", description: "", features: [], plans: [], faqs: [], imageUrl: "", brochureUrl: "", videoUrl: "", priceFrom: "", priceUnit: "", keywords: "", seoTitle: "", seoDescription: "", seoH1: "", primaryKeyword: "", secondaryKeywords: "", imageAlt: "" };

export default function ProductForm({ productId }: { productId?: number }) {
  const [cats, setCats] = useState<Cat[]>([]);
  const [form, setForm] = useState<ProductInput>(empty);
  const [featuresText, setFeaturesText] = useState("");
  const [faqsText, setFaqsText] = useState("");
  const [plans, setPlans] = useState<{ name: string; price: string; period: string; features: string }[]>([{ name: "Starter", price: "", period: "per month", features: "" }]);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.data ?? []));
    if (productId) {
      fetch(`/api/vendor/products/${productId}`).then((r) => r.json()).then((d) => {
        if (!d.ok) { setErr(d.error); setLoading(false); return; }
        const p = d.data;
        setForm({ ...empty, ...p, priceFrom: p.priceFrom ?? "", shortDescription: p.shortDescription ?? "", description: p.description ?? "", imageUrl: p.imageUrl ?? "", brochureUrl: p.brochureUrl ?? "", videoUrl: p.videoUrl ?? "", priceUnit: p.priceUnit ?? "", keywords: p.keywords ?? "", seoTitle: p.seoTitle ?? "", seoDescription: p.seoDescription ?? "", seoH1: p.seoH1 ?? "", primaryKeyword: p.primaryKeyword ?? "", secondaryKeywords: p.secondaryKeywords ?? "", imageAlt: p.imageAlt ?? "" });
        setFeaturesText((p.features ?? []).join("\n"));
        setFaqsText((p.faqs ?? []).map((f: { q: string; a: string }) => `${f.q} | ${f.a}`).join("\n"));
        if (p.plans?.length) setPlans(p.plans.map((pl: { name: string; price: string; period: string; features: string[] }) => ({ ...pl, features: pl.features.join(", ") })));
        setLoading(false);
      });
    }
  }, [productId]);

  const set = (k: keyof ProductInput, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      features: featuresText.split("\n").map((s) => s.trim()).filter(Boolean),
      faqs: faqsText.split("\n").map((l) => l.split("|")).filter((a) => a.length >= 2).map(([q, a]) => ({ q: q.trim(), a: a.trim() })),
      plans: plans.filter((p) => p.name).map((p) => ({ ...p, features: p.features.split(",").map((s) => s.trim()).filter(Boolean) })),
    };
    const r = await fetch(productId ? `/api/vendor/products/${productId}` : "/api/vendor/products", { method: productId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await r.json();
    setSaving(false);
    if (!d.ok) return setErr(d.error);
    router.push("/vendor/products"); router.refresh();
  }

  if (loading) return <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-12" />)}</div>;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="font-semibold">Basic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Product name *</label><input className="input" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. SIP Trunk for Contact Centres" /></div>
          <div><label className="label">Category *</label><select className="input" required value={form.categoryId || ""} onChange={(e) => set("categoryId", e.target.value)}><option value="">Select</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="label">Image URL</label><input className="input" value={form.imageUrl ?? ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://… (leave blank for category image)" /></div>
          <div className="sm:col-span-2"><label className="label">Short description (card) *</label><input className="input" required maxLength={400} value={form.shortDescription ?? ""} onChange={(e) => set("shortDescription", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Full description</label><textarea className="input" rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
        </div>
      </div>
      <div className="card space-y-4 p-6">
        <h2 className="font-semibold">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Starting price (₹)</label><input type="number" min={0} step="0.01" className="input" value={form.priceFrom ?? ""} onChange={(e) => set("priceFrom", e.target.value)} placeholder="Leave blank for custom quote" /></div>
          <div><label className="label">Price unit</label><input className="input" value={form.priceUnit ?? ""} onChange={(e) => set("priceUnit", e.target.value)} placeholder="per month / per user / one-time" /></div>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">Plans</p>
          {plans.map((p, i) => (
            <div key={i} className="grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
              <input className="input" placeholder="Plan name" value={p.name} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input className="input" placeholder="₹ price / Custom" value={p.price} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
              <input className="input" placeholder="per month" value={p.period} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, period: e.target.value } : x)))} />
              <input className="input" placeholder="features, comma separated" value={p.features} onChange={(e) => setPlans((ps) => ps.map((x, j) => (j === i ? { ...x, features: e.target.value } : x)))} />
            </div>
          ))}
          <button type="button" className="btn-outline py-1.5 text-xs" onClick={() => setPlans((ps) => [...ps, { name: "", price: "", period: "", features: "" }])}>+ Add plan</button>
        </div>
      </div>
      <div className="card space-y-4 p-6">
        <h2 className="font-semibold">Features, FAQs &amp; media</h2>
        <div><label className="label">Features (one per line)</label><textarea className="input" rows={5} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} /></div>
        <div><label className="label">FAQs (one per line: Question | Answer)</label><textarea className="input" rows={4} value={faqsText} onChange={(e) => setFaqsText(e.target.value)} placeholder="How fast is setup? | Within 48 hours" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Brochure URL (PDF)</label><input className="input" value={form.brochureUrl ?? ""} onChange={(e) => set("brochureUrl", e.target.value)} /></div>
          <div><label className="label">Video URL</label><input className="input" value={form.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} /></div>
        </div>
      </div>
      <div className="card space-y-4 p-6">
        <h2 className="font-semibold">SEO &amp; search</h2>
        <p className="-mt-2 text-xs text-slate-500">Defaults are generated automatically from the product name and category — edit only if you want to fine-tune.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">H1 (page heading)</label><input className="input" maxLength={200} value={form.seoH1 ?? ""} onChange={(e) => set("seoH1", e.target.value)} placeholder="auto: product name" /></div>
          <div><label className="label">Primary keyword</label><input className="input" maxLength={120} value={form.primaryKeyword ?? ""} onChange={(e) => set("primaryKeyword", e.target.value)} placeholder="sip trunk" /></div>
          <div className="sm:col-span-2"><label className="label">Secondary / long-tail keywords (comma separated)</label><input className="input" maxLength={1000} value={form.secondaryKeywords ?? ""} onChange={(e) => set("secondaryKeywords", e.target.value)} placeholder="sip trunk price in india, sip trunk provider, sip trunk for ai calling" /></div>
          <div className="sm:col-span-2"><label className="label">Image alt text</label><input className="input" maxLength={300} value={form.imageAlt ?? ""} onChange={(e) => set("imageAlt", e.target.value)} placeholder="auto-generated from product name" /></div>
        </div>
        <div><label className="label">Search keywords (incl. provider names, synonyms)</label><input className="input" value={form.keywords ?? ""} onChange={(e) => set("keywords", e.target.value)} placeholder="sip trunk, voip, ai agent, tata, airtel" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">SEO title</label><input className="input" maxLength={200} value={form.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} /></div>
          <div><label className="label">SEO description</label><input className="input" maxLength={400} value={form.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} /></div>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-3"><button disabled={saving} className="btn-primary">{saving ? "Saving…" : productId ? "Save changes" : "Submit for approval"}</button><button type="button" onClick={() => router.back()} className="btn-ghost">Cancel</button></div>
    </form>
  );
}
