export const ERGONOMICS = {
  minTouchTarget: 44,
  desktopFrequentActionHeight: 36,
  titleLineHeightMin: 1.25,
  titleLineHeightMax: 1.4,
  bodyLineHeightMin: 1.5,
  bodyLineHeightMax: 1.75,
  readingWidth: 760,
  contentMaxWidth: 1600,
} as const;

export type ErgonomicsToken = keyof typeof ERGONOMICS;
