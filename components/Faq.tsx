"use client";
import { useState } from "react";
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-slate-200">
      {items.map((f, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between py-3 text-left font-medium text-slate-900">
            {f.q}
            <span className="ml-3 text-slate-400">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && <p className="pb-4 text-sm leading-relaxed text-slate-600">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
