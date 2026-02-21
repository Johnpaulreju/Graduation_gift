"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { X } from "lucide-react";

interface FlipMemoryCardProps {
  from: { x: number; y: number };
  memory: { title: string; caption: string; imageUrl: string };
  onClose: () => void;
}

export default function FlipMemoryCard({ from, memory, onClose }: FlipMemoryCardProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  useGSAP(() => {
    const el = wrapRef.current;
    const bg = backdropRef.current;
    if (!el || !bg) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Backdrop fade in
    gsap.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.4 });

    // Card flies from star position to center, then flips
    gsap.fromTo(
      el,
      {
        x: from.x - centerX,
        y: from.y - centerY,
        scale: 0.15,
        rotate: -12,
        opacity: 0,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        opacity: 1,
        duration: 0.85,
        ease: "expo.out",
        onComplete: () => setFlipped(true),
      }
    );
  });

  const handleClose = () => {
    const el = wrapRef.current;
    const bg = backdropRef.current;
    if (!el || !bg) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    setFlipped(false);
    gsap.to(bg, { opacity: 0, duration: 0.35 });
    gsap.to(el, {
      x: from.x - centerX,
      y: from.y - centerY,
      scale: 0.15,
      rotate: -12,
      opacity: 0,
      duration: 0.45,
      ease: "power3.in",
      onComplete: onClose,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Card wrapper — positioned at center, GSAP offsets from there */}
      <div ref={wrapRef} className="relative z-10" style={{ perspective: 1200 }}>
        <div
          className={[
            "relative h-[420px] w-[320px] sm:h-[460px] sm:w-[380px]",
            "max-h-[85vh] max-w-[90vw]",
            "transition-transform duration-700 [transform-style:preserve-3d]",
            flipped ? "[transform:rotateY(180deg)]" : "",
          ].join(" ")}
        >
          {/* FRONT — teaser */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 p-6 text-center shadow-[0_30px_90px_rgba(0,0,0,0.55)] [backface-visibility:hidden]">
            <p className="text-sm uppercase tracking-widest text-[#F5C469]">
              A Memory
            </p>
            <p
              className="mt-3 font-[family-name:var(--font-playfair)] text-[#EDEBFF]"
              style={{ fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}
            >
              {memory.title}
            </p>
            <p className="mt-3 text-sm text-[#A7B0D6]">revealing...</p>
            <div className="mt-6 h-10 w-10 rounded-full border border-white/20" />
          </div>

          {/* BACK — Polaroid */}
          <div className="absolute inset-0 overflow-y-auto rounded-2xl bg-[#FAF8F0] shadow-[0_30px_90px_rgba(0,0,0,0.55)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/10 text-gray-500 transition-colors hover:bg-black/20 hover:text-gray-800"
            >
              <X size={18} />
            </button>

            {/* Image — constrained height on mobile */}
            <div className="relative w-full overflow-hidden rounded-t-2xl" style={{ maxHeight: "35vh" }}>
              <img
                src={memory.imageUrl}
                alt={memory.title}
                className="h-full w-full object-cover"
                style={{ maxHeight: "35vh" }}
              />
            </div>

            {/* Caption */}
            <div className="px-5 py-4 text-center sm:px-8 sm:py-6">
              <h3
                className="font-[family-name:var(--font-playfair)] text-[#1a1a1a]"
                style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)" }}
              >
                {memory.title}
              </h3>
              <p
                className="mt-2 leading-relaxed text-[#4a4a4a]"
                style={{ fontSize: "clamp(0.8rem, 2.2vw, 0.95rem)" }}
              >
                {memory.caption}
              </p>
            </div>

            {/* Close text button */}
            <div className="flex justify-center pb-4">
              <button
                onClick={handleClose}
                className="min-h-[44px] min-w-[44px] cursor-pointer rounded-full px-6 py-2 text-sm text-[#888] transition-colors hover:text-[#333] active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-white/40">
          tap outside to close
        </p>
      </div>
    </div>
  );
}
