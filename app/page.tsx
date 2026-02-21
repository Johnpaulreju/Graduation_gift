"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ChapterProgress from "@/components/ChapterProgress";
import WarpTransition from "@/components/WarpTransition";

/* ── Particle trail — tiny embers that fall behind the lantern ── */
function Particle({
  x,
  y,
  delay,
  size,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    gsap.fromTo(
      el,
      { x, y, opacity: 0.9, scale: 1 },
      {
        y: y + 60 + Math.random() * 40,
        x: x + (Math.random() - 0.5) * 30,
        opacity: 0,
        scale: 0,
        duration: 1.2 + Math.random() * 0.8,
        delay,
        ease: "power2.out",
      }
    );
  }, [x, y, delay]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute rounded-full"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(circle, rgba(212,175,55,0.9) 0%, rgba(255,200,80,0.4) 60%, transparent 100%)",
        filter: "blur(0.5px)",
      }}
    />
  );
}

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const lanternRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [warping, setWarping] = useState(false);
  const [released, setReleased] = useState(false);
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; delay: number; size: number }[]
  >([]);
  const [bloomActive, setBloomActive] = useState(false);
  const [waitingForRotate, setWaitingForRotate] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const particleId = useRef(0);

  // Track orientation changes
  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Once waiting for rotate AND landscape detected → fire warp
  useEffect(() => {
    if (waitingForRotate && isLandscape) {
      setWaitingForRotate(false);
      setWarping(true);
    }
  }, [waitingForRotate, isLandscape]);

  // Stable random stars
  const bgStars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: `${((i * 37 + 13) % 100)}%`,
        top: `${((i * 53 + 7) % 100)}%`,
        opacity: 0.3 + ((i * 17) % 7) / 10,
        dur: 2 + ((i * 13) % 30) / 10,
        delay: ((i * 23) % 30) / 10,
      })),
    []
  );

  // Entry animations
  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".landing-heading", {
        y: 30,
        opacity: 0,
        duration: 1.2,
      });

      tl.from(
        ".landing-sub",
        { y: 20, opacity: 0, duration: 1 },
        "-=0.6"
      );

      tl.from(
        ".lantern-wrapper",
        {
          y: 60,
          opacity: 0,
          scale: 0.8,
          duration: 1.2,
          ease: "back.out(1.2)",
        },
        "-=0.5"
      );


      // Idle lantern sway
      gsap.to(".lantern-wrapper", {
        y: -6,
        rotation: 1.5,
        duration: 2.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Idle glow pulse
      gsap.to(".lantern-glow-idle", {
        opacity: 0.6,
        scale: 1.15,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: containerRef }
  );

  // Spawn particles during rise
  useEffect(() => {
    if (!released) return;
    let stopped = false;
    let count = 0;

    const spawn = () => {
      if (stopped || count > 35) return;
      const lanternEl = lanternRef.current;
      if (!lanternEl) return;

      const rect = lanternEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height * 0.7;

      const batch: typeof particles = [];
      const num = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < num; i++) {
        batch.push({
          id: particleId.current++,
          x: cx + (Math.random() - 0.5) * 20,
          y: cy + Math.random() * 10,
          delay: Math.random() * 0.15,
          size: 3 + Math.random() * 4,
        });
      }
      setParticles((prev) => [...prev.slice(-40), ...batch]);
      count++;
      setTimeout(spawn, 80 + Math.random() * 60);
    };

    spawn();
    return () => {
      stopped = true;
    };
  }, [released]);

  const handleRelease = useCallback(() => {
    if (released) return;
    setReleased(true);

    const lanternEl = lanternRef.current;
    if (!lanternEl) return;

    const tl = gsap.timeline();

    // Kill idle animations
    gsap.killTweensOf(".lantern-wrapper");
    gsap.killTweensOf(".lantern-glow-idle");

    // Phase 1: Slight lift + brighten (anticipation)
    tl.to(lanternEl, {
      y: -20,
      scale: 1.05,
      duration: 0.4,
      ease: "power2.out",
    });

    // Phase 2: Rise — slow at first, accelerating
    tl.to(lanternEl, {
      y: -window.innerHeight * 0.65,
      scale: 0.85,
      duration: 2.8,
      ease: "power1.in",
    });

    // Glow intensifies as it rises
    tl.to(
      ".lantern-glow-idle",
      {
        opacity: 1,
        scale: 2.5,
        duration: 2.8,
        ease: "power2.in",
      },
      "-=2.8"
    );

    // Lantern body brightens
    tl.to(
      ".lantern-body",
      {
        filter: "brightness(2)",
        duration: 2.0,
        ease: "power2.in",
      },
      "-=2.4"
    );

    // Fade text as lantern rises
    tl.to(
      ".landing-heading, .landing-sub",
      {
        opacity: 0,
        y: -15,
        duration: 0.8,
        stagger: 0.08,
      },
      "-=2.0"
    );

    // Phase 3: Bloom — golden light fills, then dissolves to night
    tl.call(() => setBloomActive(true), [], "-=0.6");

    // Phase 4: After bloom fades to dark, ask user to rotate
    tl.call(
      () => {
        // If already landscape (desktop or already rotated), skip straight to warp
        if (window.innerWidth > window.innerHeight) {
          setWarping(true);
        } else {
          setWaitingForRotate(true);
        }
      },
      [],
      "+=1.6"
    );
  }, [released]);

  // Prefetch next route
  useEffect(() => {
    router.prefetch("/memories");
  }, [router]);

  // Kill GSAP on unmount
  useEffect(() => {
    return () => { gsap.killTweensOf("*"); };
  }, []);

  const handleWarpComplete = useCallback(() => {
    router.push("/memories");
  }, [router]);

  return (
    <>
      <div
        ref={containerRef}
        className="galaxy-bg galaxy-vignette galaxy-grain relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 sm:px-6 md:px-8"
      >
        <ChapterProgress current={1} />

        {/* Background stars */}
        <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
          {bgStars.map((s) => (
            <div
              key={s.id}
              className="absolute h-px w-px rounded-full bg-white"
              style={{
                left: s.left,
                top: s.top,
                opacity: s.opacity,
                animation: `twinkle ${s.dur}s ease-in-out infinite`,
                animationDelay: `${s.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center px-4 text-center">
          <h1
            className="landing-heading font-[family-name:var(--font-playfair)] leading-snug tracking-wide text-[#EDEBFF]"
            style={{ fontSize: "clamp(1.5rem, 5vw, 3rem)" }}
          >
            For you, on your graduation.
          </h1>

          <p
            className="landing-sub mt-3 text-[#A7B0D6] sm:mt-4"
            style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.125rem)" }}
          >
            I saved a few stars for you.
          </p>

          {/* ═══════ WISH LANTERN ═══════ */}
          <div
            ref={lanternRef}
            className="lantern-wrapper group mt-10 cursor-pointer sm:mt-12"
            onClick={handleRelease}
          >
            <div className="relative flex flex-col items-center">
              {/* Ambient glow behind the lantern */}
              <div
                className="lantern-glow-idle absolute -inset-8 rounded-full opacity-30"
                style={{
                  background:
                    "radial-gradient(circle, rgba(212,175,55,0.5) 0%, rgba(212,175,55,0.15) 40%, transparent 70%)",
                  filter: "blur(12px)",
                }}
              />

              {/* Lantern body */}
              <div className="lantern-body relative transition-all duration-500 group-hover:scale-105">
                {/* Top cap — small flat rectangle */}
                <div className="mx-auto h-1.5 w-5 rounded-sm bg-[#D4AF37]/40" />

                {/* Wire/string from cap to body */}
                <div className="mx-auto h-2 w-px bg-[#D4AF37]/40" />

                {/* Main lantern shape — rounded rectangle with warm glow */}
                <div
                  className="relative mx-auto flex h-20 w-14 items-center justify-center overflow-hidden rounded-lg border border-[#D4AF37]/30 sm:h-24 sm:w-16"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.08) 40%, rgba(180,120,20,0.06) 100%)",
                    boxShadow:
                      "inset 0 0 20px rgba(212,175,55,0.15), 0 0 30px rgba(212,175,55,0.1), 0 0 60px rgba(212,175,55,0.05)",
                  }}
                >
                  {/* Cross-wire pattern */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(45deg, transparent 48%, rgba(212,175,55,0.3) 49%, rgba(212,175,55,0.3) 51%, transparent 52%),
                        linear-gradient(-45deg, transparent 48%, rgba(212,175,55,0.3) 49%, rgba(212,175,55,0.3) 51%, transparent 52%)
                      `,
                      backgroundSize: "14px 14px",
                    }}
                  />

                  {/* Inner flame/light */}
                  <div
                    className="relative h-4 w-2.5 rounded-full"
                    style={{
                      background:
                        "radial-gradient(ellipse at center, rgba(255,220,120,0.9) 0%, rgba(212,175,55,0.6) 40%, transparent 70%)",
                      filter: "blur(1px)",
                      animation: "flicker 2s ease-in-out infinite",
                    }}
                  />
                </div>

                {/* Bottom rim */}
                <div className="mx-auto h-1 w-10 rounded-b-sm bg-[#D4AF37]/30 sm:w-12" />
              </div>

              {/* Label below lantern */}
              <p
                className="mt-5 font-[family-name:var(--font-playfair)] tracking-wide text-[#F8FAFC]/70"
                style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.125rem)" }}
              >
                A wish, waiting to fly
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/50 sm:text-xs">
                {released ? "rising…" : "tap to release"}
              </p>
            </div>
          </div>

        </div>

        {/* ═══════ PARTICLE TRAIL ═══════ */}
        <div className="pointer-events-none fixed inset-0 z-20">
          {particles.map((p) => (
            <Particle
              key={p.id}
              x={p.x}
              y={p.y}
              delay={p.delay}
              size={p.size}
            />
          ))}
        </div>

        {/* ═══════ WARM BLOOM OVERLAY ═══════ */}
        {bloomActive && (
          <div
            className="pointer-events-none fixed inset-0 z-30"
            style={{
              animation: "warmBloom 1.8s ease-in-out forwards",
            }}
          />
        )}

        <style jsx>{`
          @keyframes twinkle {
            0%,
            100% {
              opacity: 0.2;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.8);
            }
          }

          @keyframes flicker {
            0%,
            100% {
              opacity: 0.8;
              transform: scaleY(1) scaleX(1);
            }
            25% {
              opacity: 1;
              transform: scaleY(1.1) scaleX(0.95);
            }
            50% {
              opacity: 0.85;
              transform: scaleY(0.95) scaleX(1.05);
            }
            75% {
              opacity: 0.95;
              transform: scaleY(1.05) scaleX(0.98);
            }
          }

          @keyframes rotateHint {
            0%,
            100% {
              transform: rotate(0deg);
            }
            30% {
              transform: rotate(90deg);
            }
            60% {
              transform: rotate(90deg);
            }
            90% {
              transform: rotate(0deg);
            }
          }

          @keyframes warmBloom {
            0% {
              background: radial-gradient(
                circle at 50% 30%,
                rgba(212, 175, 55, 0) 0%,
                transparent 20%
              );
            }
            35% {
              background: radial-gradient(
                circle at 50% 30%,
                rgba(212, 175, 55, 0.6) 0%,
                rgba(255, 220, 120, 0.3) 35%,
                transparent 65%
              );
            }
            55% {
              background: radial-gradient(
                circle at 50% 30%,
                rgba(255, 240, 200, 0.9) 0%,
                rgba(212, 175, 55, 0.5) 40%,
                rgba(212, 175, 55, 0.15) 70%,
                transparent 100%
              );
            }
            80% {
              background: radial-gradient(
                circle at 50% 30%,
                rgba(212, 175, 55, 0.3) 0%,
                rgba(15, 15, 30, 0.6) 40%,
                rgba(5, 6, 15, 0.9) 80%,
                rgba(5, 6, 15, 1) 100%
              );
            }
            100% {
              background: rgba(5, 6, 15, 1);
            }
          }
        `}</style>
      </div>

      {/* ═══════ ROTATE SCREEN PROMPT ═══════ */}
      {waitingForRotate && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#05060F]">
          {/* Rotating phone icon */}
          <div
            className="text-[#D4AF37]/70"
            style={{ animation: "rotateHint 2s ease-in-out infinite" }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="7" y="2" width="10" height="20" rx="2" />
              <circle cx="12" cy="18" r="0.5" fill="currentColor" />
            </svg>
          </div>

          <p
            className="font-[family-name:var(--font-playfair)] tracking-wide text-[#EDEBFF]/80"
            style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}
          >
            Rotate your screen
          </p>
          <p className="text-xs tracking-[0.2em] text-[#A7B0D6]/50 sm:text-sm">
            landscape mode for the best experience
          </p>
        </div>
      )}

      {warping && <WarpTransition onComplete={handleWarpComplete} />}
    </>
  );
}
