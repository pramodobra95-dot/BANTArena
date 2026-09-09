import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container-x py-24 text-center">
      <p className="text-6xl">🔍</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The solution or page you are looking for does not exist.</p>
      <Link href="/products" className="btn-primary mt-6">Browse marketplace</Link>
    </div>
  );
}
