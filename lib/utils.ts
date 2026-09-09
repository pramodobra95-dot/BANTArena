export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

export function formatINR(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return null;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function timeAgo(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function buildSearchText(p: {
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  keywords?: string | null;
  features?: string[];
  categoryName?: string;
  vendorName?: string;
}) {
  return [p.name, p.categoryName, p.vendorName, p.shortDescription, p.keywords, (p.features ?? []).join(" "), p.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
export const SITE_NAME = "BANTConfirm";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bantconfirm.com";
