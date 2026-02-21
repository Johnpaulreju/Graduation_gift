"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface MessageRevealProps {
  wish: { author: string; message: string };
  from: { x: number; y: number };
  onClose: () => void;
}

export default function MessageReveal({ wish, from, onClose }: MessageRevealProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const bg = backdropRef.current;
    const card = cardRef.current;
    if (!bg || !card) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const tl = gsap.timeline();

    // Fade backdrop
    tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.3 });

    // Card flies from bottle position to center
    tl.fromTo(
      card,
      {
        x: from.x - centerX,
        y: from.y - centerY,
        scale: 0.2,
        opacity: 0,
        rotate: -10,
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        rotate: 0,
        duration: 0.7,
        ease: "expo.out",
      },
      "-=0.1"
    );
  });

  const handleClose = () => {
    const card = cardRef.current;
    const bg = backdropRef.current;
    if (!card || !bg) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const tl = gsap.timeline({ onComplete: onClose });

    tl.to(card, {
      x: from.x - centerX,
      y: from.y - centerY,
      scale: 0.2,
      opacity: 0,
      rotate: 10,
      duration: 0.45,
      ease: "power3.in",
    });

    tl.to(bg, { opacity: 0, duration: 0.25 }, "-=0.2");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={handleClose}
    >
      {/* Backdrop overlay */}
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative z-10 w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-2xl border border-[#D4AF37]/20 bg-[#0d0f1a]/95 p-5 shadow-2xl backdrop-blur-md sm:max-w-md sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button — top right */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Star divider */}
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
        </div>

        {/* Message */}
        <p
          className="text-center leading-relaxed text-white/80 font-[family-name:var(--font-playfair)]"
          style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.125rem)" }}
        >
          &ldquo;{wish.message}&rdquo;
        </p>

        {/* Author */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/30" />
          <span
            className="font-medium text-[#D4AF37]"
            style={{ fontSize: "clamp(0.75rem, 2vw, 0.875rem)" }}
          >
            — {wish.author}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/30" />
        </div>

        {/* Dismiss hint */}
        <p className="mt-4 text-center text-[10px] tracking-widest text-white/30 sm:text-[11px]">
          tap outside to seal
        </p>
      </div>
    </div>
  );
}
