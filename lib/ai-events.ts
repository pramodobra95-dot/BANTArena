"use client";
export function openBantAi(prefill?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bant-ai-open", { detail: { prefill } }));
}
