import type { ReactNode } from "react";

/** Renders schema.org JSON-LD. Server-safe, zero client JS. */
export default function JsonLd({ data }: { data: unknown | unknown[] }) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (!payload || (Array.isArray(payload) && payload.length === 0)) return null;
  return (
    <script
      type="application/ld+json"
      // JSON-LD is generated server-side from trusted DB fields; escape </script to be safe
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload).replace(/</g, "\\u003c") }}
    />
  ) as ReactNode;
}
