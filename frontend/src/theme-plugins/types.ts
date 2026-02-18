import type { ThemeConfig } from 'antd';
import type { MotionLevel, ThemeSemanticVars } from '../design-system';

export interface ThemeManifest {
  id: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  tags?: string[];
  preview?: string;
}

export interface ThemePlugin {
  manifest: ThemeManifest;
  antdTheme: ThemeConfig;
  semanticVars?: Partial<ThemeSemanticVars>;
  cssVars?: Record<string, string>;
  customCSS?: string;
  featureOverrides?: Record<
    string,
    {
      semanticVars?: Partial<ThemeSemanticVars>;
      cssVars?: Record<string, string>;
      customCSS?: string;
    }
  >;
  motion?: {
    enablePageTransition?: boolean;
    durationMs?: number;
    easing?: string;
    level?: MotionLevel;
  };
}

export interface ThemeRegistryEntry {
  id: string;
  manifest: ThemeManifest;
  loader: () => Promise<ThemePlugin>;
}
