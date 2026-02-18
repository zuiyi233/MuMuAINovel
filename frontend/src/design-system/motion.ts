export const MOTION_PRESETS = {
  none: {
    durationMs: 0,
    easing: 'linear',
  },
  fast: {
    durationMs: 160,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  normal: {
    durationMs: 240,
    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  },
  slow: {
    durationMs: 360,
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  },
} as const;

export type MotionLevel = keyof typeof MOTION_PRESETS;

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
