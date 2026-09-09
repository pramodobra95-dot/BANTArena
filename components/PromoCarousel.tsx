"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type PromoBanner = { id: number; title: string; subtitle: string | null; imageUrl: string | null; linkUrl: string | null; altText?: string | null; seoKeywords?: string | null };

const INTERVAL = 5000;

function SlideInner({ b, first }: { b: PromoBanner; first: boolean }) {
  return (
    <>
      {b.imageUrl ? (
        <Image
          src={b.imageUrl}
          alt={b.altText || `${b.title} – promotional offer on BANTConfirm`}
          fill
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-center transition duration-700 group-hover:scale-[1.03]"
          priority={first}
          loading={first ? undefined : "lazy"}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand to-blue-700" />
      )}
      {/* keeps the uploaded image clearly visible while the text stays readable:
          mobile → image on top, text at the bottom; desktop → text left, image right */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-deep via-brand-deep/85 to-brand-deep/10 md:bg-gradient-to-r md:from-brand-deep/95 md:via-brand-deep/65 md:to-transparent" />
      <div className="container-x relative flex h-full flex-col justify-end gap-2.5 py-6 md:max-w-3xl md:justify-center md:py-8">
        <span className="badge w-fit bg-accent text-brand-dark shadow-sm">★ Promotion</span>
        <h3 className="max-w-2xl text-balance text-xl font-extrabold leading-tight text-white sm:text-2xl md:text-[2rem]">{b.title}</h3>
        {b.subtitle && <p className="max-w-xl text-balance text-sm text-blue-100 md:text-base">{b.subtitle}</p>}
        {b.linkUrl && (
          <span className="btn-accent mt-1 w-fit transition group-hover:shadow-lg">
            Explore now
            <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        )}
      </div>
    </>
  );
}

export default function PromoCarousel({ banners }: { banners: PromoBanner[] }) {
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = banners.length;

  const go = useCallback(
    (next: number, direction = 1) => {
      if (total < 2) return;
      setIdx((cur) => {
        const target = ((next % total) + total) % total;
        if (target === cur) return cur;
        setPrev(cur);
        setDir(direction);
        return target;
      });
    },
    [total]
  );

  // auto-rotate every 5 seconds: 1 → 2 → 3 → 1
  useEffect(() => {
    if (total < 2 || paused) return;
    if (typeof document !== "undefined" && document.hidden) return;
    timer.current = setTimeout(() => go(idx + 1, 1), INTERVAL);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [idx, paused, go, total]);

  // no background work when the tab is hidden
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (total === 0) return null;

  return (
    <div
      className="relative isolate h-[240px] overflow-hidden rounded-2xl border border-slate-200 bg-brand-deep shadow-sm sm:h-[260px] md:h-[300px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Promotional offers"
    >
      <div className="grid h-full">
        {banners.map((b, i) => {
          const active = i === idx;
          const exiting = i === prev && !active;
          const hiddenX = dir > 0 ? "translateX(100%)" : "translateX(-100%)";
          const exitX = dir > 0 ? "translateX(-100%)" : "translateX(100%)";
          return (
            <div
              key={b.id}
              className="col-start-1 row-start-1 h-full will-change-transform"
              style={{
                transform: active ? "translateX(0)" : exiting ? exitX : hiddenX,
                opacity: active ? 1 : 0,
                pointerEvents: active ? "auto" : "none",
                transition: "transform 650ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease",
              }}
              aria-hidden={!active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${total}`}
            >
              {b.linkUrl ? (
                <Link href={b.linkUrl} className="group relative flex h-full items-center">
                  <SlideInner b={b} first={i === 0} />
                </Link>
              ) : (
                <div className="group relative flex h-full items-center">
                  <SlideInner b={b} first={i === 0} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          {/* arrows */}
          <button
            type="button"
            onClick={() => go(idx - 1, -1)}
            aria-label="Previous banner"
            className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-accent hover:text-brand-dark active:scale-90 sm:grid"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => go(idx + 1, 1)}
            aria-label="Next banner"
            className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-accent hover:text-brand-dark active:scale-90 sm:grid"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* dots */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i, i > idx ? 1 : -1)}
                aria-label={`Go to banner ${i + 1}: ${b.title}`}
                aria-current={i === idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-6 bg-accent" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>

          {/* 5s progress indicator */}
          <div className="absolute inset-x-0 bottom-0 z-20 h-0.5 bg-white/10">
            <div
              key={`${idx}-${paused}`}
              className="h-full bg-accent"
              style={{ animation: `bant-progress ${INTERVAL}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }}
            />
          </div>
        </>
      )}
    </div>
  );
}
