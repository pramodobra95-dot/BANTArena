"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AiReply } from "@/lib/assistant";

type Msg = { role: "user" | "ai"; text: string; products?: AiReply["products"]; chips?: string[]; links?: { label: string; href: string }[] };

const WELCOME: Msg = {
  role: "ai",
  text: "Hi! 👋 I'm **BANT AI** — BANTConfirm's technology consultant.\n\nI can recommend the right telecom, cloud, software or AI-calling solution, explain pricing, compare products, and guide buyers and vendors. Ask me anything!",
  chips: ["What is BANTConfirm?", "Recommend a SIP trunk for AI agents", "I need an Internet Leased Line", "Compare PRI vs SIP Trunk", "How do I become a vendor?"],
};

const OPEN_EVENT = "bant-ai-open";

function renderText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="mt-1 font-semibold text-brand">
          {line.slice(2, -2)}
        </p>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+\.)\s(.*)$/);
      return (
        <p key={i} className="mt-1 flex gap-2">
          <span className="font-bold text-accent-deep">{m?.[1]}</span>
          <span className="flex-1">{renderInline(m?.[2] ?? line)}</span>
        </p>
      );
    }
    if (line.startsWith("•")) {
      return (
        <p key={i} className="mt-1 flex gap-2 pl-1">
          <span className="text-brand">•</span>
          <span className="flex-1">{renderInline(line.slice(1).trim())}</span>
        </p>
      );
    }
    return (
      <p key={i} className={line.trim() ? "mt-1" : "h-1.5"}>
        {renderInline(line)}
      </p>
    );
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i} className="font-semibold text-brand-dark">{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [bounce, setBounce] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // open via global event (hero CTA etc.)
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail as { prefill?: string } | undefined;
      setOpen(true);
      if (d?.prefill) setInput(d.prefill);
      setTimeout(() => inputRef.current?.focus(), 250);
    };
    window.addEventListener(OPEN_EVENT, h);
    return () => window.removeEventListener(OPEN_EVENT, h);
  }, []);

  // first-visit nudge
  useEffect(() => {
    if (sessionStorage.getItem("bant-ai-nudge")) return;
    const t = setTimeout(() => {
      setBounce(true);
      sessionStorage.setItem("bant-ai-nudge", "1");
      setTimeout(() => setBounce(false), 4000);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || typing) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: content }]);
    setTyping(true);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs.slice(-6).map((m) => ({ role: m.role, content: m.text })), { role: "user", content }] }),
      });
      const d = await r.json();
      if (d.ok) {
        setMsgs((m) => [...m, { role: "ai", text: d.data.text, products: d.data.products, chips: d.data.chips, links: d.data.links }]);
      } else {
        setMsgs((m) => [...m, { role: "ai", text: "Sorry, I hit a snag. Please try again in a moment." }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "ai", text: "Sorry, I couldn't reach the assistant. Please try again." }]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open BANT AI Assistant"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-4 py-3.5 text-white shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${bounce ? "anim-glow" : ""}`}
        >
          <span className="relative">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-white" />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-bold uppercase tracking-wide text-accent">BANT AI</span>
            <span className="block text-[11px] opacity-80">Ask about any solution</span>
          </span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[min(34rem,calc(100dvh-6rem))] w-[min(25rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl anim-zoom-in">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-brand-dark via-brand to-brand px-4 py-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="currentColor">
                <path d="M12 2l1.9 5.7L20 9.5l-5 4 1.5 6.5L12 16.5 6.5 20 8 13.5l-5-4 6.1-1.8L12 2z" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            </span>
            <div className="flex-1">
              <p className="brand-wordmark text-base leading-tight">
                <span className="text-white">BANT</span>
                <span className="text-accent">Confirm</span> <span className="rounded bg-accent px-1 text-[10px] font-black uppercase text-brand-dark">AI</span>
              </p>
              <p className="text-[11px] text-blue-200">Product-aware technology consultant · online</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-lg p-1.5 text-blue-200 transition hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`anim-fade-up flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${m.role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"}`}>
                  {renderText(m.text)}
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} className="rounded-md border border-brand/20 bg-brand/5 px-2 py-1 text-[11px] font-semibold text-brand transition hover:bg-accent/25 hover:text-brand-dark">
                          📖 {l.label.replace("Guide: ", "")}
                        </Link>
                      ))}
                    </div>
                  )}
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <div key={p.slug} className="rounded-xl border-l-2 border-accent bg-slate-50 p-2.5">
                          <p className="font-semibold text-brand-dark">{p.name}</p>
                          <p className="text-[11px] text-slate-600">{p.shortDescription}</p>
                          <p className="mt-1 text-[11px] font-bold text-brand">
                            {p.priceLabel === "Custom Pricing" ? "Custom Pricing" : `₹ ${p.priceLabel.replace("₹", "")}`}
                            {p.unit && p.priceLabel !== "Custom Pricing" ? ` / ${p.unit}` : ""}
                          </p>
                          <div className="mt-1.5 flex gap-1.5">
                            <Link href={`/products/${p.slug}`} className="rounded-md bg-brand px-2 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark">View</Link>
                            <Link href={`/products/${p.slug}#enquire`} className="rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-brand-dark hover:bg-accent-deep">Request Quote</Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="anim-fade-in flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            {!typing && msgs[msgs.length - 1]?.chips && (
              <div className="flex flex-wrap gap-1.5">
                {msgs[msgs.length - 1].chips!.map((c) => (
                  <button key={c} onClick={() => send(c)} className="rounded-full border border-brand/20 bg-white px-2.5 py-1 text-[11px] font-medium text-brand transition hover:border-brand hover:bg-accent/20 hover:text-brand-dark active:scale-95">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send(input)}
                placeholder="Ask about solutions, pricing, vendors…"
                className="input flex-1"
                aria-label="Ask BANT AI"
              />
              <button
                onClick={() => send(input)}
                disabled={typing || !input.trim()}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand to-brand-dark text-white transition hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" /></svg>
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-slate-400">BANT AI recommends only real products listed on BANTConfirm. Data is stored securely.</p>
          </div>
        </div>
      )}
    </>
  );
}
