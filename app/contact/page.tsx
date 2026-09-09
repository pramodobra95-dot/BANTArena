import EnquiryForm from "@/components/EnquiryForm";
export const metadata = { title: "Contact BANTConfirm" };
export default function ContactPage() {
  return (
    <main className="container-x grid gap-8 py-10 md:grid-cols-2">
      <div><h1 className="text-3xl font-bold">Talk to a solution advisor</h1><p className="mt-2 text-slate-600">Not sure which product fits? Share your requirement and our team will match you with the right verified vendors – free of charge.</p><ul className="mt-6 space-y-2 text-sm text-slate-700"><li>📧 support@bantconfirm.com</li><li>📞 +91 1800 123 4567 (Mon–Sat, 9am–7pm IST)</li><li>📍 Mumbai · Bengaluru · Delhi NCR</li></ul></div>
      <div className="card p-6"><EnquiryForm /></div>
    </main>
  );
}
