import { RegisterForm } from "@/components/AuthForm";
export const metadata = { title: "Become a verified vendor", description: "List your telecom, cloud, software or IT solutions on BANTConfirm and receive BANT-qualified B2B leads." };
export default function VendorRegisterPage() {
  return (
    <main className="container-x grid gap-10 py-12 lg:grid-cols-2">
      <div>
        <span className="badge bg-brand/10 text-brand">For vendors</span>
        <h1 className="mt-3 text-3xl font-bold">Sell to thousands of Indian businesses</h1>
        <ul className="mt-6 space-y-3 text-slate-700">
          {["Free listing for telecom, cloud, software & IT solutions", "BANT-qualified enquiries delivered to your dashboard", "Verified badge after GST/KYC check builds trust", "Manage products, pricing, brochures and leads in one place", "SEO-optimised product pages that rank on Google"].map((t) => <li key={t} className="flex gap-2"><span className="text-emerald-600">✔</span>{t}</li>)}
        </ul>
      </div>
      <div className="card p-8"><h2 className="mb-4 text-xl font-bold">Vendor registration</h2><RegisterForm role="vendor" /></div>
    </main>
  );
}
