"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function Reveal({ children, className = "", delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "span" }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // fail-safe: content must never stay hidden (no IntersectionObserver support, iframe quirks, slow JS)
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const safety = setTimeout(() => setShown(true), 1200);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(safety);
    };
  }, []);
  const Comp = Tag as "div";
  return (
    <Comp ref={ref as never} className={`reveal ${shown ? "in-view" : ""} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </Comp>
  );
}
