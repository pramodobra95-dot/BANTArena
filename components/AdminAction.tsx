"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function AdminAction({ url, method = "PATCH", body, label, className = "btn-outline py-1 px-2 text-xs", confirmText }: { url: string; method?: string; body?: unknown; label: string; className?: string; confirmText?: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <button disabled={busy} className={className} onClick={async () => {
      if (confirmText && !confirm(confirmText)) return;
      setBusy(true);
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const d = await r.json();
      setBusy(false);
      if (!d.ok) alert(d.error);
      router.refresh();
    }}>{busy ? "…" : label}</button>
  );
}
