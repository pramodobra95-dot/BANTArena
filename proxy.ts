import { NextResponse, type NextRequest } from "next/server";
import { getRedirectMap } from "@/lib/seo";

// Proxy always runs on the Node.js runtime, so Drizzle/pg can be used directly.

const SKIP = /^\/(_next|api|images|brochures|favicon\.ico|sitemap\.xml|robots\.txt)/;

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (SKIP.test(path) || path.includes(".")) return NextResponse.next();
  try {
    const map = await getRedirectMap();
    const hit = map[path];
    if (hit) return NextResponse.redirect(new URL(hit.to, req.url), hit.status);
  } catch {
    // a redirect lookup must never break a request
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|images|brochures|favicon.ico).*)"],
};
