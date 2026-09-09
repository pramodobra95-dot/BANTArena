import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import AiAssistant from "@/components/AiAssistant";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "BANTConfirm – India's B2B Technology & Telecom Marketplace", template: "%s | BANTConfirm" },
  description: "Find verified vendors for Internet Leased Line, SIP Trunk, MPLS, Cloud Telephony, CRM, ERP, AWS, Azure, WhatsApp Business and more. Ask BANT AI, compare and request quotes in minutes.",
  keywords: ["B2B marketplace India", "internet leased line", "SIP trunk", "MPLS", "cloud telephony", "CRM software", "IT solutions vendors", "BANT AI"],
  openGraph: { type: "website", siteName: "BANTConfirm", locale: "en_IN" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased">
        <div className="h-1 w-full bg-gradient-to-r from-brand via-accent to-brand" aria-hidden />
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}.stagger > *{opacity:1 !important;animation:none !important}`}</style>
        </noscript>
        <Header />
        <PageTransition>
          <div className="flex-1">{children}</div>
        </PageTransition>
        <Footer />
        <AiAssistant />
      </body>
    </html>
  );
}
