"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function ReviewForm({ productId }: { productId: number }) {
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, title: fd.get("title"), body: fd.get("body") }) });
    const d = await r.json();
    if (d.ok) { setMsg("Thanks! Your review is live."); router.refresh(); } else setMsg(d.error);
  }
  return (
    <form onSubmit={submit} className="mt-4 space-y-2 rounded-lg bg-slate-50 p-4">
      <p className="text-sm font-semibold">Write a review</p>
      <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div>
      <input name="title" className="input" placeholder="Title" />
      <textarea name="body" className="input" rows={2} placeholder="Your experience…" />
      {msg && <p className="text-xs text-slate-600">{msg}</p>}
      <button className="btn-outline">Submit review</button>
    </form>
  );
}
