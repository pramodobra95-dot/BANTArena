import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}
export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}
export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return fail(e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 422);
  }
  console.error(e);
  return fail("Internal server error", 500);
}
