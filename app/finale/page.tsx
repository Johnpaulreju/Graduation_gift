"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ChapterProgress from "@/components/ChapterProgress";

const FinaleScene = dynamic(
  () => import("@/components/finale/FinaleScene"),
  { ssr: false }
);

/* ── Typewriter hook ── */
function useTypewriter(text: string, start: boolean, speed = 22) {
  const [out, setOut] = useState("");

  useEffect(() => {
    if (!start) return;
    setOut("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, start, speed]);

  return out;
}

/* ── Stable background stars ── */
function useBgStars(count = 80) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${((i * 37 + 13) % 100)}%`,
        top: `${((i * 53 + 7) % 100)}%`,
        opacity: 0.2 + ((i * 17) % 7) / 14,
        size: ((i * 31) % 10) > 8 ? 2 : 1,
        dur: 2 + ((i * 13) % 30) / 10,
        delay: ((i * 23) % 30) / 10,
      })),
    [count]
  );
}

export default function FinalePage() {
  // Phase states
  const [phase, setPhase] = useState<
    "typing" | "waitingForStar" | "starPlaced" | "blooming" | "final"
  >("typing");

  const [starPos, setStarPos] = useState<{ x: number; y: number } | null>(null);

  const bgStars = useBgStars(80);

  const quote = useMemo(
    () =>
      "This is just a star — but we can still reach it.\nThere is a long way to go.\nPromise me one day you will reach\nthe star that is meant for you.",
    []
  );

  const typed = useTypewriter(quote, true, 22);
  const quoteFinished = typed.length === quote.length;

  // Quote finishes → show "place your star" prompt
  useEffect(() => {
    if (quoteFinished && phase === "typing") {
      const timeout = setTimeout(() => setPhase("waitingForStar"), 800);
      return () => clearTimeout(timeout);
    }
  }, [quoteFinished, phase]);

  // Handle star placement
  const handlePlaceStar = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (phase !== "waitingForStar") return;

      let x: number, y: number;
      if ("touches" in e) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else {
        x = e.clientX;
        y = e.clientY;
      }

      setStarPos({ x, y });
      setPhase("starPlaced");

      // After 1.2s pause (let them see their star), bloom
      setTimeout(() => setPhase("blooming"), 1200);

      // After bloom animation, show final
      setTimeout(() => setPhase("final"), 2600);
    },
    [phase]
  );

  const isBeforeBloom =
    phase === "typing" || phase === "waitingForStar" || phase === "starPlaced";
  const isWhiteScreen = phase === "final";

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      onClick={handlePlaceStar}
      onTouchStart={handlePlaceStar}
    >
      {/* Chapter progress — hide once blooming */}
      {isBeforeBloom && <ChapterProgress current={4} />}

      {/* ═══════ GALAXY BACKGROUND ═══════ */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, #0a0d1a 0%, #05060f 50%, #020208 100%)",
          opacity: isWhiteScreen ? 0 : 1,
        }}
      >
        {/* Background stars */}
        {bgStars.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              animation: `twinkle ${s.dur}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ═══════ 3D SCENE (renders behind everything) ═══════ */}
      {isBeforeBloom && (
        <div className="absolute inset-0 z-[1]">
          <FinaleScene onPlaced={() => {}} />
        </div>
      )}

      {/* ═══════ QUOTE — types on the dark galaxy ═══════ */}
      {isBeforeBloom && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 sm:px-6">
          <div className="max-w-xl">
            <div
              className="whitespace-pre-line text-center leading-relaxed text-white/90"
              style={{
                fontSize: "clamp(0.9rem, 3vw, 1.25rem)",
                fontFamily:
                  '"Comic Sans MS", "Comic Sans", "Chalkboard SE", "Marker Felt", cursive, system-ui',
                textShadow: "0 0 20px rgba(255,255,255,0.15)",
              }}
            >
              {typed}
              {!quoteFinished && (
                <span className="ml-0.5 inline-block w-[1ch] animate-pulse text-white/50">
                  |
                </span>
              )}
            </div>
          </div>

          {/* "Place your star" prompt — appears after quote finishes */}
          {phase === "waitingForStar" && (
            <div
              className="mt-10 text-center"
              style={{ animation: "fadeInUp 0.8s ease-out forwards" }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/[0.04] px-5 py-2.5 backdrop-blur-sm">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-[10px] tracking-[0.18em] text-[#D4AF37]/80 sm:text-[11px] sm:tracking-[0.22em]">
                  TAP ANYWHERE TO PLACE YOUR STAR
                </span>
              </div>
            </div>
          )}

          {/* "Star placed" — brief confirmation */}
          {phase === "starPlaced" && (
            <div
              className="mt-10 text-center"
              style={{ animation: "fadeInUp 0.4s ease-out forwards" }}
            >
              <span className="text-[11px] tracking-[0.22em] text-white/40 sm:text-xs">
                your star is set ✦
              </span>
            </div>
          )}
        </div>
      )}

      {/* ═══════ PLACED STAR — glowing point at tap location ═══════ */}
      {starPos && (phase === "starPlaced" || phase === "blooming") && (
        <div
          className="pointer-events-none fixed z-20"
          style={{
            left: starPos.x,
            top: starPos.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          {/* Star core */}
          <div
            className="rounded-full bg-white"
            style={{
              width: phase === "blooming" ? 6 : 4,
              height: phase === "blooming" ? 6 : 4,
              transition: "all 0.3s ease",
              boxShadow:
                phase === "starPlaced"
                  ? `0 0 8px 4px rgba(255,255,255,0.8),
                     0 0 20px 10px rgba(255,255,255,0.4),
                     0 0 40px 20px rgba(255,255,255,0.15)`
                  : "none",
              animation:
                phase === "starPlaced"
                  ? "starPulse 1.5s ease-in-out infinite"
                  : "none",
            }}
          />
        </div>
      )}

      {/* ═══════ BLOOM — white light expanding from the star ═══════ */}
      {phase === "blooming" && starPos && (
        <>
          {/* Box-shadow bloom from star position */}
          <div
            className="pointer-events-none fixed z-[25]"
            style={{
              left: starPos.x,
              top: starPos.y,
              width: 1,
              height: 1,
              transform: "translate(-50%, -50%)",
              background: "white",
              borderRadius: "50%",
              animation: "bloomGlow 1.4s ease-out forwards",
            }}
          />
          {/* Full white cover — delayed */}
          <div
            className="pointer-events-none fixed inset-0 z-30 bg-white"
            style={{
              opacity: 0,
              animation: "whiteFade 0.8s ease-in 0.6s forwards",
            }}
          />
        </>
      )}

      {/* ═══════ FINAL — white screen with closing message ═══════ */}
      {isWhiteScreen && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white px-4 sm:px-6">
          <div
            className="flex flex-col items-center gap-4"
            style={{ animation: "fadeInUp 1s ease-out forwards" }}
          >
            <p
              className="tracking-[0.2em] text-black/40"
              style={{
                fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
                fontFamily:
                  '"Comic Sans MS", "Comic Sans", "Chalkboard SE", cursive',
              }}
            >
              for you, always.
            </p>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Link
                href="/"
                className="min-h-[48px] rounded-full border border-black/10 px-6 py-3 text-xs text-black/40 transition-colors hover:bg-black/5 hover:text-black/60 active:scale-95"
              >
                &larr; Start Over
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ KEYFRAMES ═══════ */}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.6);
          }
        }

        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes starPulse {
          0%,
          100% {
            box-shadow: 0 0 8px 4px rgba(255, 255, 255, 0.8),
              0 0 20px 10px rgba(255, 255, 255, 0.4),
              0 0 40px 20px rgba(255, 255, 255, 0.15);
          }
          50% {
            box-shadow: 0 0 12px 6px rgba(255, 255, 255, 1),
              0 0 30px 15px rgba(255, 255, 255, 0.6),
              0 0 60px 30px rgba(255, 255, 255, 0.25);
          }
        }

        @keyframes bloomGlow {
          0% {
            box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.8),
              0 0 20px 10px rgba(255, 255, 255, 0.4);
          }
          100% {
            box-shadow: 0 0 200px 150px rgba(255, 255, 255, 1),
              0 0 500px 350px rgba(255, 255, 255, 0.85),
              0 0 900px 600px rgba(255, 255, 255, 0.6),
              0 0 1500px 1000px rgba(255, 255, 255, 0.3);
          }
        }

        @keyframes whiteFade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
