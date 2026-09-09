"use client";
import { openBantAi } from "@/lib/ai-events";
export default function AskAiButton({ context, className = "btn-outline" }: { context?: string; className?: string }) {
  return (
    <button onClick={() => openBantAi(context)} className={className}>
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent-deep" fill="currentColor"><path d="M12 2l1.9 5.7L20 9.5l-5 4 1.5 6.5L12 16.5 6.5 20 8 13.5l-5-4 6.1-1.8L12 2z" /></svg>
      Ask BANT AI
    </button>
  );
}
