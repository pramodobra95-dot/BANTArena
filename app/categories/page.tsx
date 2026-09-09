import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/queries";
import { ensureSeeded } from "@/lib/seed";
export const revalidate = 300;
export const metadata: Metadata = { title: "B2B Solution Categories – Telecom, Cloud, Software, Security", description: "Explore IT software, telecom, cloud, communication, business automation, AI & calling and security solutions from verified Indian vendors.", alternates: { canonical: "/categories" } };
export default async function CategoriesPage() {
  await ensureSeeded();
  const cats = await getCategories();
  return (
    <main className="container-x py-8">
      <h1 className="text-3xl font-bold">Solution categories</h1>
      <p className="mt-1 text-slate-500">Everything an Indian business needs to connect, communicate and scale.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="card p-6 transition hover:border-brand hover:shadow-md">
            <span className="text-4xl">{c.icon}</span>
            <h2 className="mt-3 text-lg font-semibold">{c.name}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>
            <p className="mt-3 text-xs font-semibold text-brand">{c.productCount} solutions →</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
