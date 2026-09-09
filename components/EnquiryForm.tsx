"use client";

import { useState } from "react";

export default function EnquiryForm({ productId, productName }: { productId?: number; productName?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    const r = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, productId }) });
    const d = await r.json();
    if (d.ok) {
      setState("done");
    } else {
      setMsg(d.error ?? "Something went wrong");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-3xl">✅</p>
        <h3 className="mt-2 font-semibold text-emerald-900">Enquiry submitted</h3>
        <p className="mt-1 text-sm text-emerald-800">The verified vendor will contact you within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {productName && <p className="text-xs text-slate-500">Requesting quote for <span className="font-semibold text-slate-800">{productName}</span></p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name *</label><input name="name" required className="input" placeholder="Your name" /></div>
        <div><label className="label">Company</label><input name="company" className="input" placeholder="Company name" /></div>
        <div><label className="label">Work email *</label><input name="email" type="email" required className="input" placeholder="you@company.com" /></div>
        <div><label className="label">Mobile *</label><input name="phone" required pattern="[0-9+\- ]{10,15}" className="input" placeholder="98765 43210" /></div>
        <div><label className="label">City</label><input name="city" className="input" placeholder="Mumbai" /></div>
        <div><label className="label">Quantity / Users</label><input name="quantity" className="input" placeholder="e.g. 50 users / 100 Mbps" /></div>
        <div>
          <label className="label">Budget</label>
          <select name="budget" className="input" defaultValue="">
            <option value="">Select budget</option>
            <option>Under ₹25,000</option><option>₹25,000 – ₹1 Lakh</option><option>₹1 – 5 Lakh</option><option>₹5 – 25 Lakh</option><option>Above ₹25 Lakh</option>
          </select>
        </div>
        <div>
          <label className="label">Timeline</label>
          <select name="timeline" className="input" defaultValue="">
            <option value="">Select timeline</option>
            <option>Immediately</option><option>Within 1 month</option><option>1–3 months</option><option>Just researching</option>
          </select>
        </div>
      </div>
      <div><label className="label">Requirement</label><textarea name="message" rows={3} className="input" placeholder="Describe your requirement…" /></div>
      {state === "error" && <p className="text-sm text-red-600">{msg}</p>}
      <button disabled={state === "loading"} className="btn-accent w-full">{state === "loading" ? "Submitting…" : "Request Quote / Contact Vendor"}</button>
      <p className="text-center text-[11px] text-slate-500">By submitting you agree to be contacted by the vendor. Your data is stored securely.</p>
    </form>
  );
}
