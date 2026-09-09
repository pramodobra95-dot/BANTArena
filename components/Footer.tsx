import Link from "next/link";

const cols = [
  { title: "Marketplace", links: [["/products", "All Solutions"], ["/categories", "Categories"], ["/vendors", "Verified Vendors"], ["/solutions", "Buying Guides"], ["/locations", "Solutions by City"], ["/blog", "Insights"]] },
  { title: "Popular", links: [["/solutions/internet-leased-line-price-in-india", "Internet Leased Line Price"], ["/solutions/sip-trunk-for-ai-calling", "SIP Trunk for AI Calling"], ["/solutions/mpls-provider-in-india", "MPLS Providers"], ["/solutions/cloud-telephony-provider", "Cloud Telephony"], ["/solutions/business-landline-connection", "Business Landline"], ["/solutions/bulk-sms-provider-in-india", "Bulk SMS Providers"]] },
  { title: "For Vendors", links: [["/vendor/register", "Become a Vendor"], ["/login", "Vendor Login"], ["/vendor/dashboard", "Vendor Dashboard"]] },
  { title: "Company", links: [["/about", "About BANTConfirm"], ["/contact", "Contact"], ["/privacy", "Privacy Policy"], ["/terms", "Terms of Use"]] },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-brand-deep text-slate-300">
      <div className="h-1 w-full bg-gradient-to-r from-brand via-accent to-brand" />
      <div className="container-x grid gap-10 py-12 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-lg font-black text-brand-dark">B</span>
            <span className="brand-wordmark text-lg text-white">
              <span className="text-white">BANT</span>
              <span className="text-accent">Confirm</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">India&apos;s B2B technology marketplace connecting buyers with verified telecom, cloud, software and IT vendors.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-accent">{c.title}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="transition hover:text-white hover:underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} <span className="font-semibold text-slate-300">BANTConfirm</span>. All rights reserved. Made in India 🇮🇳</div>
    </footer>
  );
}
