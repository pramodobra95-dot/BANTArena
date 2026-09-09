"use client";
import Link from "next/link";
import { useState } from "react";
export default function VerifyBanner() {
  const [url, setUrl] = useState("");
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <span>⚠️ Your email is not verified yet. Verify to unlock all features.</span>
      {url ? <Link href={url} className="font-semibold underline">Open verification link</Link> : <button className="btn-outline py-1.5" onClick={async () => { const r = await fetch("/api/auth/verify"); const d = await r.json(); if (d.ok) setUrl(d.data.verifyUrl); }}>Resend verification email</button>}
    </div>
  );
}
