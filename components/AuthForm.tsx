"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fd)) });
    const d = await r.json();
    setLoading(false);
    if (!d.ok) return setErr(d.error);
    const next = sp.get("next") || (d.data.role === "admin" ? "/admin" : d.data.role === "vendor" ? "/vendor/dashboard" : "/account");
    router.push(next); router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><label className="label">Email</label><input name="email" type="email" required className="input" /></div>
      <div><label className="label">Password</label><input name="password" type="password" required className="input" /></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary w-full">{loading ? "Signing in…" : "Sign in"}</button>
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold">Demo accounts (password: Password@123)</p>
        <p>Admin: admin@bantconfirm.com · Vendor: vendor1@bantconfirm.com · Buyer: buyer@bantconfirm.com</p>
      </div>
      <p className="text-center text-sm text-slate-600">New here? <Link href="/register" className="font-semibold text-brand">Create buyer account</Link> · <Link href="/vendor/register" className="font-semibold text-brand">Register as vendor</Link></p>
    </form>
  );
}

export function RegisterForm({ role }: { role: "buyer" | "vendor" }) {
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(fd), role }) });
    const d = await r.json();
    setLoading(false);
    if (!d.ok) return setErr(d.error);
    setVerifyUrl(d.data.verifyUrl);
    router.refresh();
  }
  if (verifyUrl) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-3xl">📨</p>
        <h3 className="mt-2 font-semibold">Account created – verify your email</h3>
        <p className="mt-1 text-sm text-slate-700">We&apos;ve sent a verification link to your inbox. (Demo environment: <Link href={verifyUrl} className="font-semibold text-brand underline">click here to verify</Link>.)</p>
        <Link href={role === "vendor" ? "/vendor/dashboard" : "/account"} className="btn-primary mt-4">Continue to dashboard</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Full name *</label><input name="name" required className="input" /></div>
        <div><label className="label">Mobile *</label><input name="phone" required className="input" placeholder="98765 43210" /></div>
        <div><label className="label">Work email *</label><input name="email" type="email" required className="input" /></div>
        <div><label className="label">Password *</label><input name="password" type="password" minLength={8} required className="input" placeholder="Min 8 characters" /></div>
        <div className={role === "vendor" ? "" : "sm:col-span-2"}><label className="label">Company {role === "vendor" && "*"}</label><input name="company" required={role === "vendor"} className="input" /></div>
        {role === "vendor" && (<>
          <div><label className="label">GST number</label><input name="gstNumber" className="input" placeholder="27AAAAA0000A1Z5" /></div>
          <div><label className="label">City</label><input name="city" className="input" /></div>
          <div><label className="label">State</label><input name="state" className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Website</label><input name="website" className="input" placeholder="https://" /></div>
        </>)}
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={loading} className="btn-primary w-full">{loading ? "Creating account…" : role === "vendor" ? "Register as vendor" : "Create account"}</button>
      <p className="text-center text-sm text-slate-600">Already registered? <Link href="/login" className="font-semibold text-brand">Sign in</Link></p>
    </form>
  );
}
