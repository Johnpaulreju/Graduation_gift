"use client";

import { useRef, useEffect } from "react";

/**
 * Full-screen canvas overlay that renders a star-streak warp effect.
 * Mounts → runs the warp → calls onComplete when done.
 */
export default function WarpTransition({
  duration = 1.4,
  onComplete,
}: {
  duration?: number;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const cx = w / 2;
    const cy = h / 2;

    // Generate star streaks
    const STAR_COUNT = 200;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: Math.random() * 0.3, // start near center
      speed: 0.4 + Math.random() * 1.2,
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.5 + Math.random() * 0.5,
    }));

    const startTime = performance.now();
    const durationMs = duration * 1000;
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      ctx.clearRect(0, 0, w, h);

      // Background darkens then flashes white at the end
      if (progress < 0.85) {
        ctx.fillStyle = `rgba(5, 6, 15, ${progress * 0.6})`;
        ctx.fillRect(0, 0, w, h);
      } else {
        const flash = (progress - 0.85) / 0.15;
        ctx.fillStyle = `rgba(255, 255, 255, ${flash * 0.7})`;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw star streaks
      const accel = 1 + progress * progress * 8; // accelerating

      for (const star of stars) {
        star.dist += star.speed * 0.015 * accel;

        const x = cx + Math.cos(star.angle) * star.dist * w * 0.6;
        const y = cy + Math.sin(star.angle) * star.dist * h * 0.6;

        // Streak length grows with speed
        const streakLen = star.dist * accel * 15;
        const x2 = x - Math.cos(star.angle) * streakLen;
        const y2 = y - Math.sin(star.angle) * streakLen;

        const alpha = star.brightness * Math.min(progress * 3, 1);

        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = star.size * (1 + progress);
        ctx.stroke();

        // Bright tip
        ctx.beginPath();
        ctx.arc(x, y, star.size * (1 + progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.fill();
      }

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    raf = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
