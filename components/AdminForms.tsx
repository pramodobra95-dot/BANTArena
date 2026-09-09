"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function useSubmit(url: string) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return { msg, submit: async (body: unknown, method = "POST") => { const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); setMsg(d.ok ? "Saved." : d.error); router.refresh(); return d.ok; } };
}

export function CategoryForm() {
  const { msg, submit } = useSubmit("/api/admin/categories");
  return (
    <form className="card grid gap-3 p-4 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f); if (await submit({ name: fd.get("name"), icon: fd.get("icon"), description: fd.get("description"), seoKeywords: fd.get("seoKeywords") })) f.reset(); }}>
      <input name="name" required className="input" placeholder="Category name" /><input name="icon" className="input" placeholder="Icon emoji" maxLength={4} /><input name="seoKeywords" className="input" placeholder="SEO keywords" /><input name="description" className="input" placeholder="Description" />
      <div className="sm:col-span-4 flex items-center gap-3"><button className="btn-primary">Add category</button><span className="text-xs text-slate-500">{msg}</span></div>
    </form>
  );
}

export function BannerForm() {
  const { msg, submit } = useSubmit("/api/admin/banners");
  return (
    <form className="card grid gap-3 p-4 sm:grid-cols-4" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f); if (await submit({ title: fd.get("title"), subtitle: fd.get("subtitle"), linkUrl: fd.get("linkUrl"), position: fd.get("position"), imageUrl: fd.get("imageUrl") })) f.reset(); }}>
      <input name="title" required className="input" placeholder="Banner title" /><input name="subtitle" className="input" placeholder="Subtitle" /><input name="linkUrl" className="input" placeholder="/products?q=mpls" />
      <select name="position" className="input"><option value="home_hero">Home hero</option><option value="home_mid">Home mid</option><option value="category_top">Category top</option></select>
      <input name="imageUrl" className="input sm:col-span-3" placeholder="Image URL" />
      <div className="flex items-center gap-3"><button className="btn-primary">Add banner</button><span className="text-xs text-slate-500">{msg}</span></div>
    </form>
  );
}

export function BlogForm() {
  const { msg, submit } = useSubmit("/api/admin/blogs");
  return (
    <form className="card grid gap-3 p-4" onSubmit={async (e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f); if (await submit({ title: fd.get("title"), excerpt: fd.get("excerpt"), content: fd.get("content"), coverUrl: fd.get("coverUrl"), seoKeywords: fd.get("seoKeywords"), isPublished: fd.get("isPublished") === "on" })) f.reset(); }}>
      <input name="title" required className="input" placeholder="Article title" />
      <div className="grid gap-3 sm:grid-cols-3"><input name="excerpt" className="input" placeholder="Excerpt" /><input name="coverUrl" className="input" placeholder="Cover image URL (e.g. /images/cat-cloud.jpg)" /><input name="seoKeywords" className="input" placeholder="SEO keywords" /></div>
      <textarea name="content" required rows={5} className="input" placeholder="Content" />
      <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked className="accent-brand" /> Publish immediately</label><button className="btn-primary">Save article</button><span className="text-xs text-slate-500">{msg}</span></div>
    </form>
  );
}

export function SettingsForm({ initial }: { initial: { key: string; value: string }[] }) {
  const [items, setItems] = useState(initial);
  const { msg, submit } = useSubmit("/api/admin/settings");
  return (
    <form className="card space-y-3 p-6" onSubmit={(e) => { e.preventDefault(); submit(items); }}>
      {items.map((s, i) => <div key={s.key} className="grid gap-2 sm:grid-cols-3"><label className="text-sm font-medium sm:pt-2.5">{s.key}</label><input className="input sm:col-span-2" value={s.value} onChange={(e) => setItems((it) => it.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} /></div>)}
      <div className="grid gap-2 sm:grid-cols-3"><input className="input" placeholder="new_setting_key" id="nk" /><button type="button" className="btn-outline" onClick={() => { const el = document.getElementById("nk") as HTMLInputElement; if (el.value && !items.some((i) => i.key === el.value)) { setItems([...items, { key: el.value, value: "" }]); el.value = ""; } }}>+ Add key</button></div>
      <div className="flex items-center gap-3"><button className="btn-primary">Save settings</button><span className="text-xs text-slate-500">{msg}</span></div>
    </form>
  );
}
