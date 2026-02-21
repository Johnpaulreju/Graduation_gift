"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import dynamic from "next/dynamic";
import ChapterProgress from "@/components/ChapterProgress";
import MessageReveal from "@/components/wishes/MessageReveal";

const BottleScene = dynamic(
  () => import("@/components/wishes/BottleScene"),
  { ssr: false }
);

const WISHES = [
  {
    author: "Mom & Dad",
    message:
      "We are so incredibly proud of everything you've accomplished. The world is yours now — go shine. We'll always be cheering from the front row.",
  },
  {
    author: "Your Best Friend",
    message:
      "From freshman panic to graduation glory. I wouldn't trade this ride for anything. Here's to the next chapter — love you forever.",
  },
  {
    author: "Professor Chen",
    message:
      "Your curiosity and determination stood out from day one. The questions you asked changed the way I teach. Keep questioning everything.",
  },
  {
    author: "Your Roommate",
    message:
      "Thanks for tolerating my alarm at 6 AM and my 2 AM snack runs. You made that tiny room feel like home. You're a legend.",
  },
  {
    author: "Grandma",
    message:
      "Mi corazón, you did it! I always knew you would. Come visit soon — I'll make your favorite. So proud of the person you've become.",
  },
  {
    author: "Your Mentor",
    message:
      "The skills you've built are just the foundation. Your character is what will carry you far. Remember: the world needs what you have to give.",
  },
  {
    author: "Your Sibling",
    message:
      "Okay fine, I'll admit it — I look up to you. Don't let it go to your head though. Seriously, I'm really proud. Don't tell anyone I said that.",
  },
  {
    author: "The Whole Squad",
    message:
      "No matter where life takes us, we'll always have those memories. The group chat stays active forever. Once a crew, always a crew.",
  },
];

export default function WishesPage() {
  const headerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [openedBottles, setOpenedBottles] = useState<Set<number>>(new Set());

  const [active, setActive] = useState<{
    index: number;
    from: { x: number; y: number };
  } | null>(null);

  // Prefetch next route
  useEffect(() => {
    router.prefetch("/finale");
  }, [router]);

  // Kill GSAP on unmount
  useEffect(() => {
    return () => { gsap.killTweensOf("*"); };
  }, []);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".wishes-title", { y: -30, opacity: 0, duration: 1 });
      tl.from(".wishes-sub", { y: -20, opacity: 0, duration: 0.8 }, "-=0.5");
      tl.from(".wishes-hint", { opacity: 0, duration: 0.6 }, "-=0.3");
    },
    { scope: headerRef }
  );

  const onOpen = useCallback((index: number, screen: { x: number; y: number }) => {
    setActive({ index, from: screen });
    setOpenedBottles((prev) => new Set(prev).add(index));
  }, []);

  const onClose = useCallback(() => {
    setActive(null);
  }, []);

  return (
    <div className="galaxy-bg galaxy-vignette galaxy-grain relative h-[100dvh] w-screen overflow-hidden">
      <ChapterProgress current={3} />

      {/* Full-screen 3D bottles */}
      <div className="absolute inset-0 z-0">
        <BottleScene wishes={WISHES} onOpen={onOpen} />
      </div>

      {/* Header overlay */}
      <div
        ref={headerRef}
        className="pointer-events-none relative z-10 px-4 pt-12 pb-2 text-center sm:px-6 sm:pt-14"
      >
        <h1
          className="wishes-title font-[family-name:var(--font-playfair)] tracking-wide text-[#EDEBFF]"
          style={{ fontSize: "clamp(1.5rem, 5vw, 2.25rem)", opacity: 1 }}
        >
          Wishes & Messages
        </h1>
        <p
          className="wishes-sub mt-1 text-[#A7B0D6]"
          style={{ fontSize: "clamp(0.7rem, 2vw, 0.875rem)" }}
        >
          Tap a bottle to unseal a message
        </p>

        {/* Progress pill — compact */}
        <div className="wishes-hint mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 backdrop-blur-sm sm:mt-3 sm:px-4 sm:py-1.5">
          <span className="text-[10px] text-[#A7B0D6] sm:text-xs">
            {openedBottles.size} / {WISHES.length} unsealed
          </span>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-white/10 sm:w-16">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
              style={{ width: `${(openedBottles.size / WISHES.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Navigation — floating arrow, bottom-right */}
      <div className="absolute bottom-6 right-4 z-10 sm:bottom-8 sm:right-6">
        <button
          onClick={() => router.push("/finale")}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 backdrop-blur-sm transition-all duration-300 active:scale-90 hover:bg-[#D4AF37]/20 sm:h-14 sm:w-14"
          aria-label="The Finale"
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

      {/* Message reveal overlay */}
      {active && (
        <MessageReveal
          wish={WISHES[active.index]}
          from={active.from}
          onClose={onClose}
        />
      )}
    </div>
  );
}
