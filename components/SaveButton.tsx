"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

let meCache: { at: number; user: boolean } | null = null;
async function authState() {
  if (meCache && Date.now() - meCache.at < 60_000) return meCache.user;
  try {
    const r = await fetch("/api/auth/me", { cache: "no-store" });
    const d = await r.json();
    meCache = { at: Date.now(), user: !!d.data };
  } catch {
    meCache = { at: Date.now(), user: false };
  }
  return meCache.user;
}

export default function SaveButton({ productId, variant = "icon", className = "" }: { productId: number; variant?: "icon" | "pill"; className?: string }) {
  const [user, setUser] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    authState().then((u) => {
      if (!alive) return;
      setUser(u);
      if (u) {
        fetch(`/api/favourites?productId=${productId}`, { cache: "no-store" })
          .then((r) => r.json())
          .then((d) => alive && setSaved(!!d.data?.saved))
          .catch(() => {});
      }
    });
    return () => { alive = false; };
  }, [productId]);

  async function toggle() {
    if (user === false) return;
    setBusy(true);
    try {
      const r = await fetch("/api/favourites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
      const d = await r.json();
      if (d.ok) setSaved(d.data.saved);
    } finally {
      setBusy(false);
    }
  }

  if (user === null) {
    return (
      <span className={`grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ${className}`} aria-hidden>
        <span className="h-3.5 w-3.5 animate-pulse rounded-full bg-slate-200" />
      </span>
    );
  }

  if (variant === "pill") {
    if (!user) {
      return (
        <Link href={`/login?next=${encodeURIComponent("/saved")}`} className={`btn-outline ${className}`}>
          <Heart filled={false} /> Save
        </Link>
      );
    }
    return (
      <button onClick={toggle} disabled={busy} className={`${saved ? "btn-primary" : "btn-outline"} ${className}`} aria-pressed={saved}>
        <Heart filled={saved} /> {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={() => (user ? toggle() : (window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`))}
      disabled={busy}
      aria-label={saved ? "Remove from saved" : "Save product"}
      title={saved ? "Saved" : "Save product"}
      className={`absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/95 shadow-md ring-1 ring-slate-200 transition-all duration-200 hover:scale-110 active:scale-90 ${saved ? "text-brand" : "text-slate-400 hover:text-brand"} ${className}`}
    >
      <Heart filled={saved} />
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}
