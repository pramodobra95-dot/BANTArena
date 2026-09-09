"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { openBantAi } from "@/lib/ai-events";

const EXAMPLES = ["SIP Trunk for AI Agent", "MPLS", "Tata Internet Leased Line", "Cloud Telephony", "WhatsApp Business API", "CRM"];

type Suggestion = { name: string; slug: string; categoryName: string };

export default function SearchHero() {
  const [q, setQ] = useState("");
  const [sugg, setSugg] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) {
      setSugg([]);
      return;
    }
    timer.current = setTimeout(async () => {
      const r = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=6`);
      const d = await r.json();
      if (d.ok) setSugg(d.data.items);
    }, 250);
  }, [q]);

  function go(term: string) {
    router.push(`/products?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="relative mx-auto mt-8 max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(q.trim());
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`flex overflow-hidden rounded-xl bg-white p-1.5 shadow-2xl ring-2 transition-all duration-300 ${focused ? "ring-accent" : "ring-black/5"}`}
      >
        <span className="grid shrink-0 place-items-center pl-2 text-xl transition-transform duration-300" aria-hidden>
          {focused ? "🔎" : "⚡"}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="w-full bg-transparent px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="What business solution are you looking for?"
          aria-label="Search business solutions"
        />
        <button type="submit" className="btn-accent shrink-0 px-5 sm:px-7">
          Search
        </button>
      </form>
      {open && sugg.length > 0 && (
        <ul className="anim-zoom-in absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-white text-left shadow-xl ring-1 ring-black/5">
          {sugg.map((s) => (
            <li key={s.slug}>
              <button type="button" onMouseDown={() => router.push(`/products/${s.slug}`)} className="group flex w-full items-center justify-between px-4 py-2.5 text-sm transition hover:bg-brand/5">
                <span className="font-medium text-slate-900 group-hover:text-brand">{s.name}</span>
                <span className="flex items-center gap-2 text-xs text-slate-500">
                  {s.categoryName}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-accent-deep transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" /></svg>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
        <span className="text-blue-200">Popular:</span>
        {EXAMPLES.map((e) => (
          <button key={e} onClick={() => go(e)} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-white backdrop-blur transition-all duration-200 hover:border-accent hover:bg-white/20 hover:text-accent active:scale-95">
            {e}
          </button>
        ))}
      </div>
      <button onClick={() => openBantAi()} className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-accent/60 bg-accent/15 px-5 py-2 text-sm font-semibold text-accent backdrop-blur transition-all duration-200 hover:bg-accent hover:text-brand-dark hover:shadow-lg active:scale-95">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2l1.9 5.7L20 9.5l-5 4 1.5 6.5L12 16.5 6.5 20 8 13.5l-5-4 6.1-1.8L12 2z" /></svg>
        Ask BANT AI to find the right solution
      </button>
    </div>
  );
}
