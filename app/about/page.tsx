export const metadata = { title: "About" };
export default function Page() {
  return (
    <main className="container-x max-w-3xl py-10">
      <h1 className="text-3xl font-bold">About</h1>
      <div className="prose-b2b mt-6">
        <p>BANTConfirm is India's B2B technology marketplace. We connect businesses with verified telecom, cloud, software, communication, automation, AI and security vendors, and qualify every enquiry on Budget, Authority, Need and Timeline.</p>
        <p>Buyer data submitted through enquiry forms is stored securely, shared only with the vendor of the selected product, and never sold to third parties. Vendors are verified through GST and KYC checks before their listings go live.</p>
        <p>For questions, write to support@bantconfirm.com.</p>
      </div>
    </main>
  );
}
