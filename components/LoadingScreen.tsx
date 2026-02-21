"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen({ onReady }: { onReady?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Fast at first, slow near end
        const increment = p < 70 ? 8 : p < 90 ? 3 : 1;
        return Math.min(p + increment, 100);
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setDone(true);
        onReady?.();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [progress, onReady]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05060F]">
      <span
        className="text-2xl text-[#D4AF37]"
        style={{
          animation: "loadPulse 1.5s ease-in-out infinite",
        }}
      >
        ✦
      </span>
      <div className="mt-6 h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#D4AF37] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style jsx>{`
        @keyframes loadPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
