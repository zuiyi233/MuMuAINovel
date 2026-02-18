import { useEffect, useMemo, useRef, useState } from 'react';
import { ConfigProvider } from 'antd';
import type { ThemePlugin } from './types';
import { getAvailableThemes, loadTheme } from './index';
import { useThemeStore } from './store';
import { getAntdThemeConfig, getThemeCssVars, motion, type ThemeId } from '../design-system';

function normalizeCssVarKey(key: string): string {
  const k = key.trim();
  if (!k) return '';
  if (k.startsWith('--')) return k;
  return `--${k}`;
}

function ensureThemeStyleEl(): HTMLStyleElement {
  const id = 'mumu-theme-custom-css';
  const existing = document.getElementById(id);
  if (existing && existing.tagName === 'STYLE') {
    return existing as HTMLStyleElement;
  }
  const el = document.createElement('style');
  el.id = id;
  document.head.appendChild(el);
  return el;
}

export function ThemeProvider(props: { children: React.ReactNode }) {
  const { currentThemeId, currentFeatureKey, setAvailableThemes, setLoading, setError, setPageTransition } = useThemeStore();
  const [loadedTheme, setLoadedTheme] = useState<ThemePlugin | null>(null);
  const appliedCssVarKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    setAvailableThemes(getAvailableThemes());
  }, [setAvailableThemes]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const theme = await loadTheme(currentThemeId);
        if (!cancelled) setLoadedTheme(theme);
      } catch {
        if (!cancelled) {
          setError('主题加载失败');
          const fallback = await loadTheme('default');
          setLoadedTheme(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [currentThemeId, setLoading, setError]);

  const antdTheme = useMemo(() => {
    const themeId = (loadedTheme?.manifest?.id || currentThemeId || 'default') as ThemeId;
    const baseTheme = getAntdThemeConfig(themeId);

    if (!loadedTheme?.antdTheme) {
      return baseTheme;
    }

    return {
      ...baseTheme,
      ...loadedTheme.antdTheme,
      token: {
        ...baseTheme.token,
        ...loadedTheme.antdTheme.token,
      },
      components: {
        ...baseTheme.components,
        ...loadedTheme.antdTheme.components,
      },
    };
  }, [loadedTheme, currentThemeId]);

  useEffect(() => {
    if (!loadedTheme) return;

    const root = document.documentElement;
    root.setAttribute('data-theme', loadedTheme.manifest?.id || 'unknown');
    root.setAttribute('data-feature', currentFeatureKey || 'global');

    appliedCssVarKeys.current.forEach((k) => root.style.removeProperty(k));
    appliedCssVarKeys.current.clear();

    const themeId = (loadedTheme.manifest?.id || currentThemeId || 'default') as ThemeId;
    const baseDesignVars = getThemeCssVars(themeId);
    const baseVars = {
      ...baseDesignVars,
      ...(loadedTheme.semanticVars || {}),
      ...(loadedTheme.cssVars || {}),
    };
    const featureOverride = loadedTheme.featureOverrides?.[currentFeatureKey || 'global'];
    const featureVars = {
      ...(featureOverride?.semanticVars || {}),
      ...(featureOverride?.cssVars || {}),
    };
    const mergedVars = { ...baseVars, ...featureVars };

    Object.entries(mergedVars).forEach(([key, value]) => {
        const k = normalizeCssVarKey(key);
        if (!k) return;
        root.style.setProperty(k, value);
        appliedCssVarKeys.current.add(k);
    });

    const styleEl = ensureThemeStyleEl();
    const baseCSS = loadedTheme.customCSS || '';
    const featureCSS = featureOverride?.customCSS || '';

    const pluginMotion = loadedTheme.motion;
    const motionLevel = pluginMotion?.level ?? 'normal';
    const dsMotion = motion[motionLevel];
    const enableMotion = Boolean(pluginMotion?.enablePageTransition);
    const durationMs = pluginMotion?.durationMs ?? dsMotion.durationMs;
    const easing = pluginMotion?.easing ?? dsMotion.easing;

    setPageTransition(enableMotion, durationMs);

    const motionCSS = enableMotion
      ? `
        @media (prefers-reduced-motion: no-preference) {
          #root.mumu-page-enter {
            animation: mumuPageEnter ${durationMs}ms ${easing} both;
          }
          @keyframes mumuPageEnter {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        }
      `
      : '';

    styleEl.textContent = [baseCSS, featureCSS, motionCSS].filter(Boolean).join('\n\n');
  }, [loadedTheme, currentThemeId, currentFeatureKey, setPageTransition]);

  return (
    <ConfigProvider theme={antdTheme}>
      {props.children}
    </ConfigProvider>
  );
}
