"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import ChapterProgress from "@/components/ChapterProgress";
import FlipMemoryCard from "@/components/galaxy/FlipMemoryCard";
import { MEMORIES } from "@/data/memories";
import { useIsMobile } from "@/hooks/useIsMobile";

const ConstellationScene = dynamic(
  () => import("@/components/galaxy/ConstellationScene"),
  { ssr: false }
);

export default function MemoriesPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();
  const [openedStars, setOpenedStars] = useState<Set<number>>(new Set());

  const [active, setActive] = useState<{
    index: number;
    from: { x: number; y: number };
  } | null>(null);

  // Prefetch next route
  useEffect(() => {
    router.prefetch("/wishes");
  }, [router]);

  // Kill GSAP on unmount
  useEffect(() => {
    return () => { gsap.killTweensOf("*"); };
  }, []);

  useGSAP(
    () => {
      gsap.from(".memories-title", {
        y: -30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(".memories-subtitle", {
        y: -20,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });
    },
    { scope: headerRef }
  );

  const onPick = useCallback((index: number, screen: { x: number; y: number }) => {
    setActive({ index, from: screen });
    setOpenedStars((prev) => new Set(prev).add(index));
  }, []);

  const onCloseCard = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <div className="galaxy-bg galaxy-vignette galaxy-grain relative h-[100dvh] w-screen overflow-hidden">
      <ChapterProgress current={2} />

      {/* Full-screen Canvas */}
      <div className="absolute inset-0 z-0">
        <ConstellationScene
          name="JOHN"
          memories={MEMORIES}
          onPick={onPick}
          isMobile={isMobile}
        />
      </div>

      {/* Header overlay */}
      <div
        ref={headerRef}
        className="pointer-events-none relative z-10 px-4 pt-10 pb-6 text-center sm:px-6 sm:pt-14 sm:pb-0"
        style={{
          background: "linear-gradient(to bottom, rgba(5,6,15,0.95) 0%, rgba(5,6,15,0.7) 60%, transparent 100%)",
          minHeight: "28vh",
        }}
      >
        <h1
          className="memories-title font-[family-name:var(--font-playfair)] tracking-wide text-[#EDEBFF]"
          style={{ fontSize: "clamp(1.4rem, 5vw, 2.5rem)" }}
        >
          Your Galaxy of Memories
        </h1>
        <p
          className="memories-subtitle mt-1 text-[#A7B0D6]"
          style={{ fontSize: "clamp(0.7rem, 2vw, 0.875rem)" }}
        >
          Tap each star to reveal a memory
        </p>

        {/* Progress pill */}
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur-sm sm:mt-3 sm:px-4 sm:py-1.5">
          <span className="text-[10px] text-[#A7B0D6] sm:text-xs">
            {openedStars.size} / {MEMORIES.length} discovered
          </span>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10 sm:w-16">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
              style={{ width: `${(openedStars.size / MEMORIES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation — floating arrow, bottom-right */}
      <div className="absolute bottom-6 right-4 z-10 sm:bottom-8 sm:right-6">
        <button
          onClick={() => router.push("/wishes")}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 backdrop-blur-sm transition-all duration-300 active:scale-90 hover:bg-[#D4AF37]/20 sm:h-14 sm:w-14"
          aria-label="Continue to Wishes"
          style={{ animation: "navNudge 2s ease-in-out 3s infinite" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Flip Memory Card overlay */}
      {active && MEMORIES[active.index] && (
        <FlipMemoryCard
          from={active.from}
          memory={MEMORIES[active.index]}
          onClose={onCloseCard}
        />
      )}
    </div>
  );
}
