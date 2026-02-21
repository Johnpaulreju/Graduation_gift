export type PerfTier = "low" | "medium" | "high";

export function getDevicePerf(): PerfTier {
  if (typeof window === "undefined") return "high";

  const isMobile = window.innerWidth < 768;
  const isLowEnd = navigator.hardwareConcurrency <= 4;

  if (isMobile && isLowEnd) return "low";
  if (isMobile) return "medium";
  return "high";
}

export const PERF_SETTINGS = {
  low: {
    stars: 400,
    sparkles: 20,
    dpr: [1, 1] as [number, number],
    bloomIntensity: 0.6,
    enablePostProcessing: false,
  },
  medium: {
    stars: 800,
    sparkles: 50,
    dpr: [1, 1.5] as [number, number],
    bloomIntensity: 0.8,
    enablePostProcessing: true,
  },
  high: {
    stars: 1500,
    sparkles: 100,
    dpr: [1, 2] as [number, number],
    bloomIntensity: 1.2,
    enablePostProcessing: true,
  },
};
