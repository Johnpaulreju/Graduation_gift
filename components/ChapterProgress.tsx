"use client";

/**
 * Subtle chapter progress indicator — fixed top-right on all pages.
 * Shows current chapter as dots with the active one highlighted gold.
 */
export default function ChapterProgress({
  current,
  total = 4,
}: {
  current: number;
  total?: number;
}) {
  const labels = ["Letter", "Memories", "Wishes", "Finale"];

  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
      <span className="mr-1 text-[10px] uppercase tracking-widest text-[#A7B0D6]/50 sm:text-xs">
        {labels[current - 1] ?? ""}
      </span>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i + 1 === current
                ? "w-5 bg-[#D4AF37]"
                : i + 1 < current
                  ? "w-1.5 bg-[#D4AF37]/40"
                  : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
