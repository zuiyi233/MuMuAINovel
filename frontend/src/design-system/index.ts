import tokens from './generated/tokens.json';
import { antdThemeMap, getAntdThemeConfig, type ThemeId } from './antdMap';
import { ERGONOMICS } from './ergonomics';
import { MOTION_PRESETS, prefersReducedMotion, type MotionLevel } from './motion';

export const semanticColorKeys = [
  'color-primary',
  'color-primary-hover',
  'color-primary-active',
  'color-success',
  'color-success-active',
  'color-warning',
  'color-error',
  'color-info',
  'color-success-bg',
  'color-success-border',
  'color-warning-bg',
  'color-warning-border',
  'color-error-bg',
  'color-error-border',
  'color-info-bg',
  'color-info-border',
  'color-bg-base',
  'color-bg-container',
  'color-bg-layout',
  'color-bg-spotlight',
  'color-bg-mask',
  'color-text-base',
  'color-text-primary',
  'color-text-secondary',
  'color-text-tertiary',
  'color-text-quaternary',
  'color-border',
  'color-border-secondary',
  'color-border-light',
] as const;

export const semanticShadowKeys = ['shadow-card', 'shadow-elevated', 'shadow-primary', 'shadow-header'] as const;

export type SemanticColorKey = (typeof semanticColorKeys)[number];
export type SemanticShadowKey = (typeof semanticShadowKeys)[number];

export type ThemeSemanticVars = Record<SemanticColorKey | SemanticShadowKey, string>;

type RawThemeMap = Record<ThemeId, ThemeSemanticVars>;

const rawThemeMap = (tokens as { themes: RawThemeMap }).themes;

export const getThemeCssVars = (themeId: string): ThemeSemanticVars =>
  rawThemeMap[(themeId as ThemeId) || 'default'] ?? rawThemeMap.default;

export const themeCssVarsMap = rawThemeMap;

export {
  antdThemeMap,
  getAntdThemeConfig,
  ERGONOMICS as ergonomics,
  MOTION_PRESETS as motion,
  prefersReducedMotion,
  tokens,
};

export type { MotionLevel, ThemeId };
